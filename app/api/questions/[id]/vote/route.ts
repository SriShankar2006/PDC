import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// We don't check-then-insert (that has a time-of-check-to-time-of-use race).
// We just try to insert and let the unique(question_id, voter_id) constraint
// be the referee — it's enforced atomically as part of the insert.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: questionId } = await params;
  const { voterId } = await req.json();

  const { error } = await supabase
    .from("votes")
    .insert({ question_id: questionId, voter_id: voterId });

  if (error) {
    if (error.code === "23505") {
      // Postgres unique violation → this voter already voted on this question.
      return NextResponse.json({ error: "already voted" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
