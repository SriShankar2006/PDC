export interface Reply {
  id: string;
  answer_id: string;   // replies are scoped to an answer, not directly to a question
  content: string;
  author_name: string | null;
  created_at: string;
}

export interface Reaction {
  id: string;
  question_id: string;
  emoji: string;
  user_id: string;
  created_at: string;
}

/** Grouped reaction counts returned by GET /api/questions/[id]/reaction */
export type ReactionCounts = Record<string, number>;
