import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { generateWithFallback } from "@/lib/ai";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: "Question parameter cannot be blank." }, { status: 400 });
    }
    if (question.length > 600) {
      return NextResponse.json({ error: "Question too long (max 600 chars)." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("questions")
      .select("id, body")
      .order("created_at", { ascending: false })
      .limit(60);

    const questionList = (existing ?? [])
      .map((q: { id: string; body: string }) => q.body)
      .join("\n");

    const prompt = `You are a helpful assistant for a Q&A community platform.
A user is about to ask this question: "${question}"

Here are existing questions in the community:
${questionList}

Instructions:
- Find up to 3 existing questions that are contextually identical, similar, or highly related to the user's question.
- Return the EXACT string from the list above. Do not alter casing, formatting, or punctuation.
- If no questions match, return an empty array [].

Return ONLY a valid JSON array of strings, nothing else. Example: ["Question one?", "Question two?"]`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const rawText = response.text;
    let suggestions: string[] = [];
    if (rawText) {
      try {
        const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        suggestions = JSON.parse(cleaned);
      } catch {
        suggestions = [];
      }
    }

    const cleanSuggestions = Array.isArray(suggestions)
      ? suggestions.filter((item) => typeof item === "string" && item.trim().length > 0)
      : [];

    return NextResponse.json({ suggestions: cleanSuggestions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("❌ suggest-answers error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
