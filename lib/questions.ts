import { supabase } from "@/lib/supabase";

export async function getQuestionsPage(offset: number, limit: number) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, created_at, pinned, votes(direction)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit); // inclusive → asks for limit + 1 rows

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        "Supabase table 'public.questions' is missing. Run the SQL in supabase/schema.sql in your Supabase project."
      );
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((q) => ({
    id: q.id,
    body: q.body,
    author: q.author,
    pinned: q.pinned ?? false,
    votes: q.votes?.reduce((sum, vote) => sum + (vote.direction ?? 0), 0) ?? 0,
  }));

  const hasMore = rows.length > limit; // got the extra row? there's a next page
  return { questions: rows.slice(0, limit), hasMore };
}

export async function searchQuestions(q: string, limit: number) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, pinned, votes(direction)")
    .textSearch("body", q, { type: "websearch", config: "english" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        "Supabase table 'public.questions' is missing. Run the SQL in supabase/schema.sql in your Supabase project."
      );
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    author: row.author,
    pinned: row.pinned ?? false,
    votes: row.votes?.reduce((sum, vote) => sum + (vote.direction ?? 0), 0) ?? 0,
  }));
}
