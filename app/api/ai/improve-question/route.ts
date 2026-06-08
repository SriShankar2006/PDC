import { NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }
    if (question.length > 600) {
      return NextResponse.json({ error: "Question too long (max 600 chars)." }, { status: 400 });
    }

    const prompt = `You are a helpful assistant for a Q&A community platform.
Improve the following question to make it clearer, more specific, and grammatically correct.
Keep it concise (1-2 sentences max). Return ONLY the improved question text, nothing else, no quotes.

Original question: "${question}"`;

    const response = await generateWithFallback({ contents: prompt });
    const improved = response.text ? response.text.trim() : "";
    return NextResponse.json({ improved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ improve-question error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
