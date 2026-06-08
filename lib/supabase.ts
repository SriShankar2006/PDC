import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const targetUrl = rawSupabaseUrl || "https://wncouoxtjedezhcgqmnh.supabase.co";
const cleanedSupabaseUrl = targetUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

// 1. Safe Public Client Key Configuration
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

// 🎛️ TEMP DIAGNOSTIC CRASH-PAD
if (typeof window === "undefined") {
  console.log("==================================================");
  console.log("⚙️ SUPABASE ENVIRONMENT LOG:");
  console.log(`- TARGET URL: "${cleanedSupabaseUrl}"`);
  console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY PRESENT: ${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
  console.log(`- SUPABASE_ANON_KEY PRESENT: ${!!process.env.SUPABASE_ANON_KEY}`);
  console.log(`- RESOLVED ANON KEY LENGTH: ${anonKey.length}`);
  if (anonKey) {
    console.log(`- KEY STARTS WITH: "${anonKey.substring(0, 7)}"`);
    console.log(`- KEY ENDS WITH: "${anonKey.substring(anonKey.length - 5)}"`);
  } else {
    console.log("❌ ALERT: RESOLVED TO AN EMPTY STRING. FALLING BACK TO PLACEHOLDER.");
  }
  console.log("==================================================");
}

export const supabase = createClient(
  cleanedSupabaseUrl,
  anonKey || "placeholder-key"
);

// 2. Private Isolated Server-Side Client Configuration
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("❌ Security Violation: High-privilege admin client cannot be executed on the client-side.");
  }
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("❌ Environment Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  
  return createClient(cleanedSupabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}