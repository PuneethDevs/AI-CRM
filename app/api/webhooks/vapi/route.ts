import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || body;

    // We only care about end-of-call-report
    if (message.type && message.type !== "end-of-call-report") {
      return NextResponse.json({ status: "ignored_event_type" });
    }

    const analysis = message.analysis || {};
    const structured = analysis.structuredData || {};
    const customer = message.customer || {};

    const callId = message.call?.id || message.id || `vapi_${Date.now()}`;
    const customerName =
      structured.customerName ||
      structured.lead_name ||
      customer.name ||
      "Caller";
    const customerPhone =
      structured.customerPhone ||
      structured.lead_phone ||
      customer.number ||
      "";
    const customerAddress =
      structured.customerAddress ||
      structured.lead_address ||
      "";
    const issueDescription =
      structured.issueDescription ||
      structured.lead_issue ||
      "";

    const summary = analysis.summary || "";
    const transcript = message.transcript || "";
    const recordingUrl = message.recordingUrl || message.artifact?.recordingUrl || "";
    const durationSeconds = message.durationSeconds || message.call?.duration || 0;

    // Find default organization (Apex Heating & Air)
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
        duration_seconds: Math.round(durationSeconds),
        status: "new",
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, callId });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
