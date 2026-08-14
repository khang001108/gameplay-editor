import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** true khi đã điền VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY trong .env.local — xem SUPABASE_SETUP.md */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url as string, anonKey as string) : null;
