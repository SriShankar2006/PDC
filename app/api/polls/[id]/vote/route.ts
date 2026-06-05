import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;
  const { optionId, voterId } = await req.json();

  if (!optionId || !voterId) {
    return NextResponse.json({ error: "Missing optionId or voterId." }, { status: 400 });
  }

  const { error } = await supabase
    .from("poll_votes")
    .insert({ poll_id: pollId, poll_option_id: optionId, voter_id: voterId })
    .onConflict("poll_id,voter_id")
    .merge();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
