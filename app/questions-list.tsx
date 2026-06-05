"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type Answer = {
  id: string;
  body: string;
  author: string | null;
  reactions?: { [emoji: string]: number };
  replies?: Answer[];
};

type Question = {
  id: string;
  body: string;
  author: string | null;
  votes: number;
  pinned?: boolean;
  answers?: Answer[];
};

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "🔥", "😮", "🤔", "👏", "✨"];

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
}: {
  initialQuestions: Question[];
  initialHasMore: boolean;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [expandedReply, setExpandedReply] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const id = setTimeout(async () => {
      const url = query
        ? `/api/questions?q=${encodeURIComponent(query)}`
        : `/api/questions`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.questions);
      setHasMore(data.hasMore);
    }, 300);

    return () => clearTimeout(id);
  }, [query]);

  function improveDraft() {
    const text = draft.trim();
    if (!text) return;

    const normalized = text.replace(/\s+/g, " ").trim();
    const capitalized = normalized[0].toUpperCase() + normalized.slice(1);
    const punctuated = /[?.!]$/.test(capitalized)
      ? capitalized
      : `${capitalized}?`;

    setDraft(punctuated);
  }

  async function submit() {
    if (!draft.trim()) return;

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    const created = await res.json();

    setQuestions((qs) => [{ ...created, votes: 0, pinned: false, answers: [] }, ...qs]);
    setDraft("");
  }

  async function togglePin(id: string, pinned: boolean) {
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, pinned } : q))
    );

    const res = await fetch(`/api/questions/${id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    });

    if (!res.ok) {
      setQuestions((qs) =>
        qs.map((q) => (q.id === id ? { ...q, pinned: !pinned } : q))
      );
    }
  }

  async function submitAnswer(questionId: string) {
    const text = answerText[questionId]?.trim();
    if (!text) return;

    setQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: [
                ...(q.answers ?? []),
                {
                  id: Math.random().toString(),
                  body: text,
                  author: null,
                  reactions: {},
                  replies: [],
                },
              ],
            }
          : q
      )
    );
    setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
  }

  async function addEmojiReaction(
    questionId: string,
    answerId: string,
    emoji: string
  ) {
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers?.map((a) =>
                a.id === answerId
                  ? {
                      ...a,
                      reactions: {
                        ...a.reactions,
                        [emoji]: (a.reactions?.[emoji] ?? 0) + 1,
                      },
                    }
                  : a
              ),
            }
          : q
      )
    );
  }

  async function submitReply(
    questionId: string,
    answerId: string
  ) {
    const text = replyText[answerId]?.trim();
    if (!text) return;

    setQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers?.map((a) =>
                a.id === answerId
                  ? {
                      ...a,
                      replies: [
                        ...(a.replies ?? []),
                        {
                          id: Math.random().toString(),
                          body: text,
                          author: null,
                          reactions: {},
                          replies: [],
                        },
                      ],
                    }
                  : a
              ),
            }
          : q
      )
    );
    setReplyText((prev) => ({ ...prev, [answerId]: "" }));
  }

  async function loadMore() {
    setLoading(true);
    const res = await fetch(`/api/questions?offset=${questions.length}`);
    const data = await res.json();
    setQuestions((qs) => [...qs, ...data.questions]);
    setHasMore(data.hasMore);
    setLoading(false);
  }

  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <div className="space-y-5">
      {/* Ask Box */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Ask a Question</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="What would you like to ask?"
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={improveDraft}
              className="rounded-xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-all hover:border-brand hover:bg-brand/5"
            >
              Improve
            </button>
            <button
              onClick={submit}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-strong hover:shadow-lg"
            >
              Ask
            </button>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50"
        />
        <span className="text-xs text-muted">
          {hydrated ? "Interactive ✓" : "Loading…"}
        </span>
      </div>

      {/* Questions List */}
      <ul className="space-y-4">
        {sortedQuestions.map((q) => (
          <li
            key={q.id}
            className="rounded-2xl border border-border bg-surface p-5 shadow-md transition-all hover:shadow-lg"
          >
            {/* Question Header */}
            <div className="flex items-start justify-between gap-4">
              {/* Question Text */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium leading-relaxed text-foreground">
                  {q.body}
                </p>
                {q.author && (
                  <p className="mt-2 text-xs text-muted">by {q.author}</p>
                )}
              </div>

              {/* Pin Button */}
              <button
                onClick={() => togglePin(q.id, !q.pinned)}
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-all hover:border-brand hover:bg-brand/5"
              >
                {q.pinned ? "📌" : "📍"}
              </button>
            </div>

            {/* Answers Section */}
            <div className="mt-5 space-y-3 border-t border-border pt-4">
              <button
                onClick={() =>
                  setExpandedQuestion(
                    expandedQuestion === q.id ? null : q.id
                  )
                }
                className="text-sm font-medium text-brand hover:underline"
              >
                {q.answers?.length ?? 0} Answer{(q.answers?.length ?? 0) !== 1 ? "s" : ""}
              </button>

              {expandedQuestion === q.id && (
                <div className="space-y-3">
                  {/* Existing Answers */}
                  {q.answers?.map((answer) => (
                    <div
                      key={answer.id}
                      className="rounded-lg border border-border bg-background p-4 space-y-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{answer.body}</p>
                        {answer.author && (
                          <p className="mt-2 text-xs text-muted">by {answer.author}</p>
                        )}
                      </div>

                      {/* Emoji Reactions */}
                      <div className="flex flex-wrap gap-2">
                        {EMOJI_REACTIONS.map((emoji) => {
                          const count = answer.reactions?.[emoji] ?? 0;
                          return (
                            <button
                              key={emoji}
                              onClick={() => addEmojiReaction(q.id, answer.id, emoji)}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                                count > 0
                                  ? "bg-brand/10 border border-brand text-brand"
                                  : "border border-border text-muted hover:border-brand hover:bg-brand/5"
                              }`}
                            >
                              {emoji} {count > 0 && count}
                            </button>
                          );
                        })}
                      </div>

                      {/* Replies Section */}
                      {answer.replies && answer.replies.length > 0 && (
                        <div className="ml-4 space-y-2 border-l border-border pl-4">
                          {answer.replies.map((reply) => (
                            <div key={reply.id} className="text-sm">
                              <p className="text-foreground">{reply.body}</p>
                              {reply.author && (
                                <p className="text-xs text-muted">by {reply.author}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Button and Form */}
                      <div className="space-y-2">
                        {expandedReply === answer.id && (
                          <div className="rounded-lg border border-border bg-surface p-3">
                            <textarea
                              value={replyText[answer.id] ?? ""}
                              onChange={(e) =>
                                setReplyText({
                                  ...replyText,
                                  [answer.id]: e.target.value,
                                })
                              }
                              placeholder="Write a reply…"
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50"
                              rows={2}
                            />
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => submitReply(q.id, answer.id)}
                                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-brand-strong"
                              >
                                Post Reply
                              </button>
                              <button
                                onClick={() => setExpandedReply(null)}
                                className="rounded-lg border border-border px-3 py-1.5 text-sm transition-all hover:bg-background"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {expandedReply !== answer.id && (
                          <button
                            onClick={() => setExpandedReply(answer.id)}
                            className="text-xs text-brand font-medium hover:underline"
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Answer */}
                  <div className="rounded-lg border border-border bg-background p-3">
                    <textarea
                      value={answerText[q.id] ?? ""}
                      onChange={(e) =>
                        setAnswerText({
                          ...answerText,
                          [q.id]: e.target.value,
                        })
                      }
                      placeholder="Write your answer…"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50"
                      rows={2}
                    />
                    <button
                      onClick={() => submitAnswer(q.id)}
                      className="mt-2 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-brand-strong"
                    >
                      Post Answer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {sortedQuestions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted">
            No questions yet. Be the first to ask something!
          </p>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium transition-all hover:border-brand hover:bg-brand/5 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more questions"}
          </button>
        </div>
      )}
    </div>
  );
}

