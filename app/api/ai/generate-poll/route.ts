import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { generateWithFallback } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic?.trim()) {
      return NextResponse.json({ error: "Topic parameter cannot be blank." }, { status: 400 });
    }

    const prompt = `You are a helpful assistant for a Q&A community platform.
Generate an engaging poll about the following topic: "${topic}"

Rules:
- Question must be engaging and community-friendly
- Provide exactly 3-4 options
- Options must be short (1-5 words each)
- No numbering or alphabetic bullets in options

Return ONLY valid JSON in this exact shape, nothing else:
{"question":"...", "options":["...", "...", "..."]}`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["question", "options"],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) return NextResponse.json({ error: "AI returned empty content." }, { status: 500 });

    const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const poll = JSON.parse(cleaned);

    if (!poll.question || !Array.isArray(poll.options) || poll.options.length < 2) {
      return NextResponse.json({ error: "AI returned incomplete poll data." }, { status: 500 });
    }

    return NextResponse.json(poll);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ generate-poll error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
