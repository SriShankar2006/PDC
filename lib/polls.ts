import { supabase } from "@/lib/supabase";

type PollOptionRow = {
  id: string;
  label: string;
  position: number;
};

type PollRow = {
  id: string;
  question: string;
  created_at: string;
  poll_options: PollOptionRow[];
  poll_votes: { poll_option_id: string }[];
};

export async function getPolls() {
  // ⚡ Retrieve polls, options, and related votes in a single round-trip
  const { data, error } = await supabase
    .from("polls")
    .select(`
      id,
      question,
      created_at,
      poll_options (
        id,
        label,
        position
      ),
      poll_votes (
        poll_option_id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Map the aggregated query result directly into the frontend interface shape
  return (data as unknown as PollRow[] ?? []).map((poll) => {
    const rawOptions = Array.isArray(poll.poll_options) ? poll.poll_options : [];
    const rawVotes = Array.isArray(poll.poll_votes) ? poll.poll_votes : [];

    // Ensure options honor the intended order position constraint
    const sortedOptions = [...rawOptions].sort((a, b) => a.position - b.position);

    return {
      id: poll.id,
      question: poll.question,
      options: sortedOptions.map((option) => ({
        id: option.id,
        label: option.label,
        // Match child vote lengths instantly for this specific option id
        votes: rawVotes.filter((v) => v.poll_option_id === option.id).length,
      })),
    };
  });
}