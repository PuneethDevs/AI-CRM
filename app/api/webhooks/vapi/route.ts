import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || body;

    // Handle end-of-call-report and status updates from Vapi
    if (message.type && message.type !== "end-of-call-report" && message.type !== "call.ended") {
      return NextResponse.json({ status: "ignored_event_type" });
    }

    const analysis = message.analysis || {};
    const structured = analysis.structuredData || {};
    const customer = message.customer || {};
    const callObj = message.call || {};

    const callId = callObj.id || message.id || `vapi_${Date.now()}`;
    const customerName =
      structured.customerName ||
      structured.lead_name ||
      customer.name ||
      "US Caller";
    const customerPhone =
      structured.customerPhone ||
      structured.lead_phone ||
      customer.number ||
      "+1 (555) 019-2831";
    const customerAddress =
      structured.customerAddress ||
      structured.lead_address ||
      structured.city_state ||
      "Austin, TX";
    const issueDescription =
      structured.issueDescription ||
      structured.lead_issue ||
      structured.service_requested ||
      "Inbound inquiry handled by Riya";

    const summary = analysis.summary || "Call completed and logged by VoXUSA AI Voice Agent (Riya).";
    const transcript = message.transcript || "";
    const recordingUrl = message.recordingUrl || message.artifact?.recordingUrl || "";
    const durationSeconds = Math.round(message.durationSeconds || callObj.duration || 0);

    // 1. Detect Call Direction (Inbound vs Outbound) from Vapi
    const rawType = (callObj.type || "").toLowerCase();
    const isOutbound =
      rawType.includes("outbound") ||
      message.direction === "outbound" ||
      callObj.direction === "outbound";
    const direction: "inbound" | "outbound" = isOutbound ? "outbound" : "inbound";

    // 2. Detect Call Outcome (Answered, Missed, or Failed)
    const endedReason = (message.endedReason || callObj.endedReason || "").toLowerCase();
    const isMissed =
      durationSeconds === 0 ||
      endedReason.includes("no-answer") ||
      endedReason.includes("busy") ||
      endedReason.includes("did-not-answer") ||
      endedReason.includes("voicemail");
    const callStatus: "answered" | "missed" | "failed" = isMissed
      ? "missed"
      : endedReason.includes("failed")
      ? "failed"
      : "answered";

    // 3. Lead Qualification Stage (New, Contacted, or Booked)
    const isBooked =
      structured.booked === true ||
      structured.meeting_scheduled === true ||
      summary.toLowerCase().includes("booked") ||
      summary.toLowerCase().includes("scheduled");
    const leadStatus: "new" | "contacted" | "booked" = isBooked
      ? "booked"
      : durationSeconds > 30
      ? "contacted"
      : "new";

    // Fetch primary organization if available
    const { data: orgs } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .limit(1);

    const orgId = orgs && orgs.length > 0 ? orgs[0].id : null;

    // Insert call lead into Supabase
    const { data, error } = await supabaseAdmin.from("calls").insert([
      {
        org_id: orgId,
        vapi_call_id: callId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        issue_description: issueDescription,
        summary: summary,
        transcript: transcript,
        recording_url: recordingUrl,
        duration_seconds: durationSeconds,
        direction: direction,
        call_status: callStatus,
        status: leadStatus,
      },
    ]);

    if (error) {
      console.error("Supabase insert error in VoXUSA webhook:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Forward to Make.com automation (Google Sheets, Gmail/Email, Calendar) if configured
    const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (makeWebhookUrl) {
      try {
        await fetch(makeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "call_completed",
            call_id: callId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_address: customerAddress,
            issue_description: issueDescription,
            summary: summary,
            transcript: transcript,
            recording_url: recordingUrl,
            duration_seconds: durationSeconds,
            direction: direction,
            call_status: callStatus,
            status: leadStatus,
            timestamp: new Date().toISOString(),
          }),
        });
        console.log(`[VoXUSA Vapi Webhook] Forwarded call data to Make.com automation successfully`);
      } catch (makeErr) {
        console.warn("[VoXUSA Vapi Webhook] Make.com forwarding note:", makeErr);
      }
    }

    console.log(`[VoXUSA Vapi Webhook] Successfully logged ${direction} call (${callStatus}) for ${customerName}`);
    return NextResponse.json({ success: true, callId, direction, callStatus, leadStatus });
  } catch (err: any) {
    console.error("VoXUSA Webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
