import { supabase } from "@/lib/supabase";

type PollOptionRow = {
  id: string;
  label: string;
  poll_id: string;
  position: number;
};

type PollRow = {
  id: string;
  question: string;
  created_at: string;
};

export async function getPolls() {
  const { data: polls, error: pollsError } = await supabase
    .from("polls")
    .select("id, question, created_at")
    .order("created_at", { ascending: false });

  if (pollsError) throw new Error(pollsError.message);

  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .select("id, label, poll_id, position")
    .order("poll_id", { ascending: true })
    .order("position", { ascending: true });

  if (optionsError) throw new Error(optionsError.message);

  const { data: votes, error: votesError } = await supabase
    .from("poll_votes")
    .select("poll_option_id");

  if (votesError) throw new Error(votesError.message);

  const optionVotes = new Map<string, number>();
  for (const vote of votes ?? []) {
    if (!vote.poll_option_id) continue;
    optionVotes.set(
      vote.poll_option_id,
      (optionVotes.get(vote.poll_option_id) ?? 0) + 1
    );
  }

  const optionsByPoll = new Map<string, PollOptionRow[]>();
  for (const option of (options ?? []) as PollOptionRow[]) {
    const pollId = option.poll_id;
    if (!pollId) continue;
    const existing = optionsByPoll.get(pollId) ?? [];
    existing.push(option);
    optionsByPoll.set(pollId, existing);
  }

  return (polls ?? []).map((poll: PollRow) => ({
    id: poll.id,
    question: poll.question,
    options: (optionsByPoll.get(poll.id) ?? []).map((option) => ({
      id: option.id,
      label: option.label,
      votes: optionVotes.get(option.id) ?? 0,
    })),
  }));
}
