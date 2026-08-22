import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

export function requireSupabase() {
  if (!supabase) throw new Error("إعدادات Supabase غير مكتملة. أضف VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY.");
  return supabase;
}
