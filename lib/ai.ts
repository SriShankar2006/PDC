/**
 * Shared Gemini AI client with automatic model fallback.
 *
 * Free-tier daily limits (as of mid-2025):
 *   gemini-2.0-flash-lite  →  1,500 req/day BUT the free tier is now quota-restricted
 *   gemini-2.0-flash       →    200 req/day  ✅ primary
 *   gemini-1.5-flash       →    500 req/day  ✅ fallback
 *   gemini-1.5-flash-8b    →    500 req/day  ✅ last resort
 *
 * The 429 / RESOURCE_EXHAUSTED error means the model's free-tier quota is
 * fully exhausted for the day. We catch it and try the next model in the list.
 */

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY / GOOGLE_API_KEY in environment");

export const ai = new GoogleGenAI({ apiKey });

// Models tried in order — first one with quota wins
const FALLBACK_CHAIN = [
  "gemini-2.5-flash",        // Best quality, try first
  "gemini-2.0-flash",        // Reliable fallback
  "gemini-2.0-flash-lite",   // Last resort
];

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("503") ||
    msg.includes("UNAVAILABLE")
  );
}

function extractRetryMs(err: unknown): number | null {
  const msg = err instanceof Error ? err.message : String(err);
  // e.g. "retryDelay":"59.536s"  or  "Please retry in 59.5s"
  const m = msg.match(/(\d+(?:\.\d+)?)\s*s/);
  return m ? Math.ceil(parseFloat(m[1]) * 1000) + 500 : null;
}

export async function generateWithFallback(
  params: Omit<Parameters<typeof ai.models.generateContent>[0], "model">
): Promise<ReturnType<typeof ai.models.generateContent>> {
  let lastErr: unknown;

  for (const model of FALLBACK_CHAIN) {
    // Each model gets up to 2 retries for transient errors (overload / brief rate spike)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`🤖 Gemini: trying ${model} (attempt ${attempt + 1})`);
        const result = await ai.models.generateContent({ ...params, model });
        return result;
      } catch (err) {
        lastErr = err;
        if (!isRateLimitError(err)) throw err; // non-rate-limit → bubble up immediately

        const isQuotaExhausted =
          (err instanceof Error ? err.message : String(err)).includes("quota") ||
          (err instanceof Error ? err.message : String(err)).includes("RESOURCE_EXHAUSTED");

        if (isQuotaExhausted) {
          // Quota is fully exhausted for this model today → skip to next model
          console.warn(`⚠️  ${model} quota exhausted — trying next model`);
          break;
        }

        // Transient rate limit — wait then retry same model
        const waitMs = extractRetryMs(err) ?? 1000 * Math.pow(2, attempt);
        console.warn(`⚠️  ${model} rate-limited — waiting ${waitMs}ms (attempt ${attempt + 1}/3)`);
        await new Promise((r) => setTimeout(r, Math.min(waitMs, 30_000)));
      }
    }
  }

  throw new Error(
    `All Gemini models exhausted their quota. Last error: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`
  );
}
