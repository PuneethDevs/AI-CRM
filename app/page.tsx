"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  Search,
  Users,
  CalendarCheck,
  Flame,
  Play,
  Clock,
  MapPin,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  Headphones,
} from "lucide-react";
import VoiceTester from "@/components/VoiceTester";
import CallDetailModal from "@/components/CallDetailModal";
import { supabase, CallRecord } from "@/lib/supabase";

export default function DashboardPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "contacted" | "booked">("all");
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("calls")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching calls:", error);
      } else if (data) {
        setCalls(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();

    // Subscribe to new inbound calls in real-time
    const channel = supabase
      .channel("realtime:calls")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls" },
        (payload) => {
          setCalls((prev) => [payload.new as CallRecord, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusUpdate = (id: string, newStatus: "new" | "contacted" | "booked") => {
    setCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  };

  const filteredCalls = calls.filter((c) => {
    const matchesSearch =
      (c.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.customer_phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.customer_address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.issue_description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCalls = calls.length;
  const newLeads = calls.filter((c) => c.status === "new").length;
  const bookedJobs = calls.filter((c) => c.status === "booked").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-lg">Apex Voice</span>
                <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                  SaaS Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">Client: <span className="text-slate-200 font-medium">Apex Heating & Air</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sarah (AI Receptionist) Active
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Calls</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <Phone className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{totalCalls}</span>
              <span className="text-xs text-emerald-400 font-medium">Inbound</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">New Leads</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-300">{newLeads}</span>
              <span className="text-xs text-amber-400/80 font-medium">Requires action</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Booked Jobs</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400">{bookedJobs}</span>
              <span className="text-xs text-slate-400">Dispatched</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pipeline Est.</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">${totalCalls * 250}</span>
              <span className="text-xs text-slate-400 font-medium">Avg $250/ticket</span>
            </div>
          </div>
        </div>

        {/* Voice AI Testing Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <VoiceTester />
          </div>

          {/* Quick Info / Live Vapi Card */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-base">AI Receptionist Capabilities</h3>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-mono text-slate-300">
                  Sarah v11 (OpenAI + Soniox)
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Sarah automatically handles 24/7 inbound calls, answers common HVAC queries, collects
                caller contact info, address, and diagnostic issue details, and passes them straight into
                this portal, your email, and SMS.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[11px] text-slate-400">Latency</span>
                  <p className="text-sm font-semibold text-emerald-400">~1,530 ms</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[11px] text-slate-400">Voice Pipeline</span>
                  <p className="text-sm font-semibold text-white">Soniox + GPT-4.1</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <span className="text-[11px] text-slate-400">Webhook Integration</span>
                  <p className="text-sm font-semibold text-indigo-400">Live Auto-Sync</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Webhook Endpoint: <code className="text-indigo-400 font-mono">/api/webhooks/vapi</code></span>
              <button
                onClick={fetchCalls}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh Calls
              </button>
            </div>
          </div>
        </div>

        {/* Calls & Leads Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          {/* Table Header / Filters */}
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search leads by name, phone, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filter:
              </span>
              {(["all", "new", "contacted", "booked"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                    statusFilter === filter
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-3.5">Customer / Contact</th>
                  <th className="px-6 py-3.5">Service Address</th>
                  <th className="px-6 py-3.5">HVAC Issue</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                          <span>Loading call records...</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-slate-400">No calls found</p>
                          <p className="mt-1 text-xs">
                            Calls received by Sarah will instantly appear here via webhook.
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className="cursor-pointer transition-colors hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white text-sm">
                          {call.customer_name || "Caller"}
                        </div>
                        <div className="text-slate-400 text-xs mt-0.5">
                          {call.customer_phone || "No phone"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>{call.customer_address || "No address"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 max-w-sm truncate">
                        {call.issue_description || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(call.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            call.status === "new"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : call.status === "contacted"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {call.status === "new" && "● New"}
                          {call.status === "contacted" && "● Contacted"}
                          {call.status === "booked" && "● Booked"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCall(call);
                          }}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 ml-auto"
                        >
                          Details <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Call Details Modal */}
      {selectedCall && (
        <CallDetailModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
