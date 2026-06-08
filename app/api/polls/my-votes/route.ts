import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const voterId = searchParams.get("voterId")?.trim();

  if (!voterId) {
    return NextResponse.json({ error: "Missing voterId." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("poll_votes")
    .select("poll_id, poll_option_id")
    .eq("voter_id", voterId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return array of { pollId, optionId } for every poll this voter voted in
  const result = (data ?? [])
    .filter((row) => row.poll_id && row.poll_option_id)
    .map((row) => ({ pollId: row.poll_id, optionId: row.poll_option_id }));

  return NextResponse.json(result);
}
