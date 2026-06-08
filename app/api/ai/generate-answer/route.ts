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

    const prompt = `You are a knowledgeable and helpful assistant for a Q&A community platform.
Write a clear, helpful, and concise answer to the following question.
Keep it to 2-4 sentences. Be direct and informative.
Return ONLY the answer text, nothing else.

Question: "${question}"`;

    const response = await generateWithFallback({ contents: prompt });
    const answer = response.text ? response.text.trim() : "";
    return NextResponse.json({ answer });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ generate-answer error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
