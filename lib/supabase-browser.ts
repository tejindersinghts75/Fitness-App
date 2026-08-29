import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://configuration-required.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "configuration-required";

export const isSupabaseConfigured = !url.includes("configuration-required") && key !== "configuration-required";
export const supabase = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
