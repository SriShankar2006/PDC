import { supabase } from "@/lib/supabase";

export async function getQuestionsPage(offset: number, limit: number) {
  // PostgREST range boundaries are inclusive on both ends. 
  // Fetch limit + 1 records to natively detect trailing database records.
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, created_at, pinned, votes(direction), answers(id, answer_text, created_at)")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        "Supabase table 'public.questions' is missing. Run the SQL in supabase/schema.sql."
      );
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((q) => ({
    id: q.id,
    body: q.body,
    author: q.author,
    pinned: q.pinned ?? false,
    votes: q.votes?.reduce((sum: number, vote: { direction: number }) => sum + (vote.direction ?? 0), 0) ?? 0,
    answers: (q.answers ?? []).map((a: { id: string; answer_text: string; created_at: string }) => ({
      id: a.id,
      body: a.answer_text,
      author: null,
      reactions: {} as Record<string, number>,
      replies: [] as never[],
    })),
  }));

  const hasMore = rows.length > limit;
  return { questions: rows.slice(0, limit), hasMore };
}

export async function searchQuestions(q: string, limit: number) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, pinned, votes(direction), answers(id, answer_text, created_at)")
    .textSearch("body", q, { type: "websearch", config: "english" })
    .order("created_at", { ascending: false })
    .limit(limit + 1); // ⚡ Fetch limit + 1 here as well to detect pagination boundaries

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        "Supabase table 'public.questions' is missing. Run the SQL in supabase/schema.sql."
      );
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    author: row.author,
    pinned: row.pinned ?? false,
    votes: row.votes?.reduce((sum: number, vote: { direction: number }) => sum + (vote.direction ?? 0), 0) ?? 0,
    answers: (row.answers ?? []).map((a: { id: string; answer_text: string; created_at: string }) => ({
      id: a.id,
      body: a.answer_text,
      author: null,
      reactions: {} as Record<string, number>,
      replies: [] as never[],
    })),
  }));

  const hasMore = rows.length > limit;
  
  // ⚡ Returns the precise data structure expected by app/api/questions/route.ts
  return { 
    questions: rows.slice(0, limit), 
    hasMore 
  };
}