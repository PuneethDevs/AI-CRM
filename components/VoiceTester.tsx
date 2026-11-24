"use client";

import React, { useState, useEffect, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { PhoneCall, PhoneOff, Volume2, Sparkles, Loader2 } from "lucide-react";

interface VoiceTesterProps {
  publicKey?: string;
  assistantId?: string;
}

export default function VoiceTester({
  publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "",
  assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "",
}: VoiceTesterProps) {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active">("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeMessage, setActiveMessage] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const vapiInstance = new Vapi(publicKey);
    setVapi(vapiInstance);

    vapiInstance.on("call-start", () => {
      setCallStatus("active");
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    });

    vapiInstance.on("call-end", () => {
      setCallStatus("idle");
      setIsSpeaking(false);
      setVolumeLevel(0);
      if (timerRef.current) clearInterval(timerRef.current);
    });

    vapiInstance.on("speech-start", () => {
      setIsSpeaking(true);
    });

    vapiInstance.on("speech-end", () => {
      setIsSpeaking(false);
    });

    vapiInstance.on("volume-level", (volume: number) => {
      setVolumeLevel(Math.min(100, Math.round(volume * 100)));
    });

    vapiInstance.on("message", (msg: any) => {
      if (msg.type === "transcript" && msg.transcriptType === "partial") {
        setActiveMessage(msg.transcript);
      }
    });

    vapiInstance.on("error", (err: any) => {
      console.error("Vapi error:", err);
      setCallStatus("idle");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        vapiInstance.stop();
      } catch (e) {}
    };
  }, [publicKey]);

  const handleStartCall = async () => {
    if (!vapi || !assistantId) {
      alert("Missing Vapi Assistant ID or Public Key.");
      return;
    }
    try {
      setCallStatus("connecting");
      await vapi.start(assistantId);
    } catch (err: any) {
      console.error("Failed to start call:", err);
      alert("Microphone access is required or invalid Assistant ID: " + (err?.message || err));
      setCallStatus("idle");
    }
  };

  const handleEndCall = () => {
    if (vapi) {
      vapi.stop();
    }
    setCallStatus("idle");
    setIsSpeaking(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Live Voice AI Tester</h3>
            <p className="text-xs text-slate-400">Speak into your microphone to test Sarah</p>
          </div>
        </div>

        {callStatus === "active" && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Connected · {formatDuration(duration)}
          </div>
        )}
      </div>

      <div className="my-6 flex flex-col items-center justify-center py-4">
        {callStatus === "idle" && (
          <button
            onClick={handleStartCall}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-indigo-500/50 active:scale-95"
          >
            <PhoneCall className="h-8 w-8 transition-transform group-hover:rotate-12" />
          </button>
        )}

        {callStatus === "connecting" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-indigo-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <span className="text-sm text-slate-400">Connecting to Sarah...</span>
          </div>
        )}

        {callStatus === "active" && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${
                  isSpeaking
                    ? "bg-indigo-600 ring-8 ring-indigo-500/30 scale-105"
                    : "bg-slate-800 ring-4 ring-slate-700"
                }`}
              >
                <Volume2 className={`h-10 w-10 text-white ${isSpeaking ? "animate-pulse" : ""}`} />
              </div>

              {/* Visual audio pulse */}
              <div
                className="absolute -inset-2 rounded-full border border-indigo-500/30 transition-transform duration-75 pointer-events-none"
                style={{ transform: `scale(${1 + volumeLevel / 150})` }}
              />
            </div>

            <div className="text-center">
              <span className="text-sm font-medium text-slate-300">
                {isSpeaking ? "Sarah is speaking..." : "Listening to you..."}
              </span>
              {activeMessage && (
                <p className="mt-2 max-w-sm rounded-lg bg-slate-800/60 p-2 text-xs italic text-slate-400">
                  &ldquo;{activeMessage}&rdquo;
                </p>
              )}
            </div>

            <button
              onClick={handleEndCall}
              className="mt-2 flex items-center gap-2 rounded-full bg-red-500/10 px-5 py-2 text-xs font-semibold text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500 hover:text-white"
            >
              <PhoneOff className="h-4 w-4" />
              End Test Call
            </button>
          </div>
        )}
      </div>

      {callStatus === "idle" && (
        <p className="text-center text-xs text-slate-500">
          Click the call button to start an instant voice conversation in your browser.
        </p>
      )}
    </div>
  );
}
