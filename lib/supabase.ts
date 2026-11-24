import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin / Server-side Supabase client (bypasses RLS for webhooks)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

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
  status: "new" | "contacted" | "booked";
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  notification_email?: string;
  notification_phone?: string;
}
