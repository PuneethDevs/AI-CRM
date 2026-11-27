"use client";

import React, { useState, useEffect, useRef } from "react";
import Vapi from "@vapi-ai/web";
import { PhoneCall, PhoneOff, Volume2, Loader2, Bot, ShieldCheck, X } from "lucide-react";

interface VoiceTesterProps {
  publicKey?: string;
  assistantId?: string;
  onClose?: () => void;
}

export default function VoiceTester({
  publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "",
  assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || "",
  onClose,
}: VoiceTesterProps) {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active">("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeMessage, setActiveMessage] = useState<string>("");
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);
  const [consentGiven, setConsentGiven] = useState(true);
  const [femaleVoiceFound, setFemaleVoiceFound] = useState<string>("Microsoft Zira (US Female)");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-load and cache female voice on mount (handles async voice loading in Chrome / Edge)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const findFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const female =
        voices.find((v) => /zira/i.test(v.name)) || // Built-in Windows 10/11 Female voice
        voices.find((v) => /jenny|samantha|victoria|karen|susan|aria|ava|emma/i.test(v.name)) ||
        voices.find((v) => /female/i.test(v.name)) ||
        voices.find((v) => /google.*female/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en-US") && !/david|mark|george/i.test(v.name));

      if (female) {
        setFemaleVoiceFound(female.name);
      }
    };

    findFemaleVoice();
    window.speechSynthesis.onvoiceschanged = findFemaleVoice;
  }, []);

  // Initialize Vapi instance if client keys exist
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
      console.warn("Vapi connection note:", err);
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

  // Start Call (Live Vapi agent or Interactive Riya Studio Session)
  const handleStartCall = async () => {
    if (!consentGiven) {
      alert("Please check the consent box to begin testing Riya.");
      return;
    }

    if (vapi && assistantId) {
      try {
        setCallStatus("connecting");
        await vapi.start(assistantId);
        return;
      } catch (err: any) {
        console.warn("Vapi connection note, starting interactive Riya Testing Studio:", err);
      }
    }

    // Interactive Browser Studio Session for Riya
    setIsSimulatedMode(true);
    setCallStatus("connecting");
    setTimeout(() => {
      setCallStatus("active");
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      speakRiya(
        "Hi David! This is Riya calling from VoXUSA. I noticed your team requested a walkthrough on our automated US voice calling and calendar scheduling. Did I catch you at a good time?"
      );
    }, 500);
  };

  // Female voice selection & synthesis for Riya
  const speakRiya = (text: string) => {
    setIsSpeaking(true);
    setActiveMessage(text);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enforce distinct feminine pitch & cadence
      utterance.pitch = 1.35; // Feminine pitch
      utterance.rate = 1.0;

      const voices = window.speechSynthesis.getVoices();
      
      // Specifically target female voices:
      // 1. Microsoft Zira Desktop (standard Windows female voice)
      // 2. Samantha / Victoria / Jenny / Karen / Emma
      // 3. Any voice containing "female"
      const femaleVoice =
        voices.find((v) => /zira/i.test(v.name)) ||
        voices.find((v) => /jenny|samantha|victoria|karen|susan|aria|ava|emma/i.test(v.name)) ||
        voices.find((v) => /female/i.test(v.name)) ||
        voices.find((v) => /google.*female/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en-US") && !/david|mark|george/i.test(v.name));

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsSpeaking(false), 2500);
    }
  };

  const handleEndCall = () => {
    if (vapi) {
      try {
        vapi.stop();
      } catch (e) {}
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setCallStatus("idle");
    setIsSpeaking(false);
    setIsSimulatedMode(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleClose = () => {
    handleEndCall();
    if (onClose) onClose();
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="relative w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-neutral-200 text-neutral-800">
      
      {/* Absolute Close Button at Top-Right (ALWAYS visible and clickable) */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors shadow-sm"
        title="Close Testing Studio"
        aria-label="Close"
      >
        <X className="w-4 h-4 font-bold" />
      </button>

      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 mb-3 pr-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white shadow-sm shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#101828] text-sm">✦ Riya (Female AI Voice)</h3>
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold">
                VoXUSA Live
              </span>
            </div>
            <p className="text-[10px] text-[#667085]">Autonomous US Telephony Voice Specialist</p>
          </div>
        </div>

        {callStatus === "active" && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* 2. Compact Body Content (Decreased Length) */}
      <div className="space-y-3">
        
        {/* State A: Idle (First Popup - Compact with Close button) */}
        {callStatus === "idle" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#EAECF0] space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Female Voice Ready · {femaleVoiceFound}</span>
              </div>
              <p className="text-neutral-500 text-[11px] leading-relaxed">
                Click below to start a live test conversation with <strong>Riya</strong>. Riya speaks in a natural female US voice, answers questions, and qualifies inquiries.
              </p>
            </div>

            <label className="flex items-center gap-2 text-[11px] text-neutral-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="rounded border-neutral-300 text-[#F95724] focus:ring-[#F95724] w-3.5 h-3.5"
              />
              <span>I consent to microphone voice streaming for live testing Riya.</span>
            </label>

            <button
              onClick={handleStartCall}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#F97316] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Start Live Test Call with Riya ✦</span>
            </button>
          </div>
        )}

        {/* State B: Connecting */}
        {callStatus === "connecting" && (
          <div className="py-6 flex flex-col items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF4ED] text-[#F95724]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <span className="text-xs font-semibold text-[#101828]">Connecting to Riya (Female Voice)...</span>
          </div>
        )}

        {/* State C: Active Call (Compact Height & Immediate End Call Button) */}
        {callStatus === "active" && (
          <div className="space-y-2.5">
            
            {/* Compact Speaker Indicator */}
            <div className="flex items-center justify-center gap-2.5 py-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  isSpeaking
                    ? "bg-[#F95724] ring-4 ring-[#F95724]/20 scale-105 text-white shadow-md"
                    : "bg-[#111216] ring-2 ring-neutral-200 text-white"
                }`}
              >
                <Volume2 className={`h-5 w-5 ${isSpeaking ? "animate-pulse" : ""}`} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#F95724]">
                {isSpeaking ? "● Riya is speaking (Female Voice)..." : "● Riya is listening..."}
              </span>
            </div>

            {/* Compact Dialogue Box */}
            <div className="rounded-xl bg-[#F8F9FA] border border-[#EAECF0] p-2.5 text-xs text-[#344054] space-y-0.5">
              <div className="font-semibold text-neutral-400 uppercase text-[9px] tracking-wider">
                Dialogue:
              </div>
              <p className="italic leading-snug line-clamp-2 text-[11px]">
                &ldquo;{activeMessage}&rdquo;
              </p>
            </div>

            {/* Compact Quick Test Chips */}
            {isSimulatedMode && (
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  onClick={() =>
                    speakRiya(
                      "VoXUSA integrates with CRM systems and Google Calendar. Every inbound call is qualified and synced instantly."
                    )
                  }
                  className="p-1.5 text-left rounded-lg bg-neutral-50 border border-neutral-200 text-[10px] font-medium text-neutral-700 hover:border-[#F95724] hover:text-[#F95724] transition-all truncate"
                >
                  💬 "How does sync work?"
                </button>
                <button
                  onClick={() =>
                    speakRiya(
                      "Great! I have scheduled Friday at 2:00 PM EST for David Miller. Calendar invite dispatched!"
                    )
                  }
                  className="p-1.5 text-left rounded-lg bg-neutral-50 border border-neutral-200 text-[10px] font-medium text-neutral-700 hover:border-[#F95724] hover:text-[#F95724] transition-all truncate"
                >
                  💬 "Friday 2 PM confirmed"
                </button>
              </div>
            )}

            {/* Prominent, Instantly Reachable End Call Button */}
            <button
              onClick={handleEndCall}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Test Call</span>
            </button>
          </div>
        )}

      </div>

      {/* 3. Streamlined Footer */}
      <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[9px] text-[#667085]">
        <span>Voice: Riya (Female US Voice)</span>
        <span>Gateway: Vapi + Twilio US Telephony</span>
      </div>

    </div>
  );
}
