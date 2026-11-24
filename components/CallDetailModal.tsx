"use client";

import React, { useState } from "react";
import { X, User, Phone, MapPin, Wrench, FileText, CheckCircle2, Clock } from "lucide-react";
import { CallRecord, supabase } from "@/lib/supabase";

interface CallDetailModalProps {
  call: CallRecord;
  onClose: () => void;
  onStatusUpdate: (id: string, status: "new" | "contacted" | "booked") => void;
}

export default function CallDetailModal({
  call,
  onClose,
  onStatusUpdate,
}: CallDetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState(call.status);
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusChange = async (newStatus: "new" | "contacted" | "booked") => {
    setCurrentStatus(newStatus);
    setIsSaving(true);
    try {
      await supabase.from("calls").update({ status: newStatus }).eq("id", call.id);
      onStatusUpdate(call.id, newStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              {call.customer_name || "Unknown Caller"}
            </h2>
            <p className="text-xs text-slate-400">
              {new Date(call.created_at).toLocaleString()} · Duration:{" "}
              {call.duration_seconds ? `${Math.round(call.duration_seconds)}s` : "N/A"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Lead Status:</span>
            <select
              value={currentStatus}
              disabled={isSaving}
              onChange={(e) =>
                handleStatusChange(e.target.value as "new" | "contacted" | "booked")
              }
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="new">🟡 New Lead</option>
              <option value="contacted">🔵 Contacted</option>
              <option value="booked">🟢 Booked Job</option>
            </select>
          </div>
        </div>

        {/* Audio Player if recording URL exists */}
        {call.recording_url && (
          <div className="my-5 rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-4">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-indigo-300">
              🎙️ Call Recording
            </span>
            <audio controls className="w-full h-10 rounded">
              <source src={call.recording_url} type="audio/wav" />
              <source src={call.recording_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Lead Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <Phone className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Phone Number</p>
              <a
                href={`tel:${call.customer_phone}`}
                className="text-sm font-semibold text-white hover:text-indigo-400"
              >
                {call.customer_phone || "Not provided"}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <MapPin className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Service Address</p>
              <p className="text-sm font-semibold text-white">
                {call.customer_address || "Not provided"}
              </p>
            </div>
          </div>

          <div className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <Wrench className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 font-medium">HVAC Issue / Request</p>
              <p className="text-sm font-semibold text-slate-100">
                {call.issue_description || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {call.summary && (
          <div className="my-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-400" /> AI Call Summary
            </h4>
            <p className="text-xs leading-relaxed text-slate-300">{call.summary}</p>
          </div>
        )}

        {/* Full Transcript */}
        {call.transcript && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Full Call Transcript
            </h4>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {call.transcript}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
