import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.SUPABASE_URL ?? "";
const cleanedSupabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

if (!cleanedSupabaseUrl) {
  throw new Error("SUPABASE_URL is required and must be the project base URL, e.g. https://xyz.supabase.co");
}

export const supabase = createClient(
  cleanedSupabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

