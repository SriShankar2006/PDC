import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
    const { emoji, userId } = await req.json();

    if (!emoji || !userId) {
      return NextResponse.json({ error: "emoji and userId are required." }, { status: 400 });
    }

    // Upsert — unique constraint (question_id, user_id, emoji) prevents duplicates
    const { data, error } = await supabase
      .from("reactions")
      .upsert(
        { question_id: questionId, emoji, user_id: userId },
        { onConflict: "question_id,user_id,emoji" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;

    const { data, error } = await supabase
      .from("reactions")
      .select("emoji")
      .eq("question_id", questionId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Group by emoji and count
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      counts[row.emoji] = (counts[row.emoji] ?? 0) + 1;
    }

    return NextResponse.json(counts);
  } catch {
    return NextResponse.json({ error: "Failed to fetch reactions." }, { status: 500 });
  }
}
