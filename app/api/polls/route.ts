import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select("id, question, created_at")
    .order("created_at", { ascending: false });

  if (pollsError) {
    return NextResponse.json({ error: pollsError.message }, { status: 500 });
  }

  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .select("id, label, poll_id");

  if (optionsError) {
    return NextResponse.json({ error: optionsError.message }, { status: 500 });
  }

  const { data: votes, error: votesError } = await supabase
    .from("poll_votes")
    .select("poll_option_id");

  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  const optionVotes = new Map<string, number>();
  for (const vote of votes ?? []) {
    if (!vote.poll_option_id) continue;
    optionVotes.set(
      vote.poll_option_id,
      (optionVotes.get(vote.poll_option_id) ?? 0) + 1
    );
  }

  const optionsByPoll = new Map<string, typeof options>();
  for (const option of options ?? []) {
    const pollId = option.poll_id;
    if (!pollId) continue;
    const existing = optionsByPoll.get(pollId) ?? [];
    existing.push(option);
    optionsByPoll.set(pollId, existing);
  }

  return NextResponse.json(
    (polls ?? []).map((poll) => ({
      id: poll.id,
      question: poll.question,
      options: (optionsByPoll.get(poll.id) ?? []).map((option) => ({
        id: option.id,
        label: option.label,
        votes: optionVotes.get(option.id) ?? 0,
      })),
    }))
  );
}

export async function POST(req: Request) {
  const { question, options } = await req.json();
  const trimmedQuestion = String(question ?? "").trim();
  const validOptions = Array.isArray(options)
    ? options.map((option: string) => String(option).trim()).filter(Boolean)
    : [];

  if (!trimmedQuestion || validOptions.length < 2) {
    return NextResponse.json(
      { error: "Poll needs a question and at least two options." }, 
      { status: 400 }
    );
  }

  const { data: poll, error } = await supabase
    .from("polls")
    .insert({ question: trimmedQuestion })
    .select()
    .single();

  if (error || !poll) {
    return NextResponse.json({ error: error?.message ?? "Failed to create poll." }, { status: 500 });
  }

  const optionRows = validOptions.map((label: string) => ({
    poll_id: poll.id,
    label,
  }));

  const { data: insertedOptions, error: optionError } = await supabase
    .from("poll_options")
    .insert(optionRows)
    .select();

  if (optionError) {
    return NextResponse.json({ error: optionError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: poll.id,
    question: poll.question,
    options: (insertedOptions ?? []).map((option) => ({
      id: option.id,
      label: option.label,
      votes: 0,
    })),
  });
}
