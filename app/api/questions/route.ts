import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getQuestionsPage, searchQuestions } from "@/lib/questions";

const PAGE_SIZE = 10;

// ─── GET: FETCH OR SEARCH FOR COMMUNITY QUESTIONS ─────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    // 1. If keyword exists, redirect immediately to fuzzy engine match wrappers
    if (q) {
      const questions = await searchQuestions(q, PAGE_SIZE);
      return NextResponse.json({ questions, hasMore: false });
    }

    // 2. Otherwise execute incremental list scroll calculations
    const offset = Number(searchParams.get("offset") ?? 0);
    const { questions, hasMore } = await getQuestionsPage(offset, PAGE_SIZE);
    return NextResponse.json({ questions, hasMore });
  } catch (err) {
    return NextResponse.json({ error: "Failed to resolve question matrix stream." }, { status: 500 });
  }
}

// ─── POST: SUBMIT A NEW COMMUNITY QUESTION ────────────────────────────────────
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const body = payload?.body?.trim();
    const author = payload?.author?.trim() || null;

    // Data Consistency Validation
    if (!body) {
      return NextResponse.json({ error: "Question payload string cannot be blank." }, { status: 400 });
    }

    // Submit payload matrix into Supabase instances
    const { data, error } = await supabase
      .from("questions")
      .insert({ 
        body, 
        author
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Malformed payload submission structure." }, { status: 400 });
  }
}