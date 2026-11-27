import { createClient } from "@supabase/supabase-js";

// Safe fallback for SSR so Next.js never crashes if env keys are missing
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-voxusa.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin / Server-side Supabase client (bypasses RLS for webhooks)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface CallRecord {
  id: string;
  org_id?: string;
  vapi_call_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  issue_description?: string;
  summary?: string;
  transcript?: string;
  recording_url?: string;
  duration_seconds?: number;
  direction?: "inbound" | "outbound";
  call_status?: "answered" | "missed" | "failed";
  status: "new" | "contacted" | "booked";
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  notification_email?: string;
  notification_phone?: string;
}
