import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const { optionId, voterId } = await req.json();
    const selectedOptionId = String(optionId ?? "").trim();
    const voter = String(voterId ?? "").trim();

    if (!pollId || !selectedOptionId || !voter) {
      return NextResponse.json({ error: "Missing optionId or voterId." }, { status: 400 });
    }

    // Verify option belongs to this poll
    const { data: option, error: optionError } = await supabase
      .from("poll_options")
      .select("id")
      .eq("id", selectedOptionId)
      .eq("poll_id", pollId)
      .maybeSingle();

    if (optionError) return NextResponse.json({ error: optionError.message }, { status: 500 });
    if (!option) return NextResponse.json({ error: "Option does not belong to this poll." }, { status: 400 });

    // Check if voter already voted on this poll
    const { data: existing } = await supabase
      .from("poll_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("voter_id", voter)
      .maybeSingle();

    if (existing) {
      // Update existing vote to the new option
      const { error: updateError } = await supabase
        .from("poll_votes")
        .update({ poll_option_id: selectedOptionId })
        .eq("id", existing.id);

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    } else {
      // Insert new vote
      const { error: insertError } = await supabase
        .from("poll_votes")
        .insert({ poll_id: pollId, poll_option_id: selectedOptionId, voter_id: voter });

      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
