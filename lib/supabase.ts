import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// If empty during build time, use a placeholder so it doesn't crash the compiler
const targetUrl = rawSupabaseUrl || "https://wncouoxtjedezhcgqmnh.supabase.co";

const cleanedSupabaseUrl = targetUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

// Use the Anon Key or Service Role Key, whichever is available
const supabaseKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!rawSupabaseUrl && typeof window !== 'undefined') {
  console.warn("⚠️ Supabase credentials are missing from environment variables.");
}

export const supabase = createClient(
  cleanedSupabaseUrl,
  supabaseKey || "placeholder-key"
);