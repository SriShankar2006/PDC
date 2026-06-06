"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Reply = {
  id: string;
  content: string;
  author_name: string | null;
  created_at: string;
};

type Answer = {
  id: string;
  body: string;
  author: string | null;
  reactions: Record<string, number>;
  replies: Reply[];
};

type Question = {
  id: string;
  body: string;
  author: string | null;
  votes: number;
  pinned?: boolean;
  answers?: Answer[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "🎉"];

function getUserId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("kealvi_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("kealvi_user_id", id);
  }
  return id;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Reaction Bar (per question) ─────────────────────────────────────────────

function QuestionReactions({ questionId }: { questionId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [reacted, setReacted] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const fetchCounts = useCallback(async () => {
    const res = await fetch(`/api/questions/${questionId}/reaction`);
    if (res.ok) setCounts(await res.json());
  }, [questionId]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  async function handleReact(emoji: string) {
    if (busy || reacted.has(emoji)) return;
    setBusy(true);
    setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
    setReacted((prev) => new Set([...prev, emoji]));

    const res = await fetch(`/api/questions/${questionId}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji, userId: getUserId() }),
    });

    if (!res.ok) {
      setCounts((prev) => ({ ...prev, [emoji]: Math.max((prev[emoji] ?? 1) - 1, 0) }));
      setReacted((prev) => { const s = new Set(prev); s.delete(emoji); return s; });
    } else {
      await fetchCounts();
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {EMOJI_REACTIONS.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const active = reacted.has(emoji);
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            disabled={busy}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all
              ${active
                ? "bg-brand/15 border-brand text-brand scale-105"
                : "border-border text-muted hover:border-brand hover:bg-brand/5"
              } disabled:opacity-60`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="tabular-nums font-semibold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Replies (per answer) ─────────────────────────────────────────────────────

function AnswerReplies({ questionId }: { questionId: string }) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loaded) return;
    fetch(`/api/questions/${questionId}/reply`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setReplies(data); setLoaded(true); });
  }, [questionId, loaded]);

  async function postReply() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);

    const res = await fetch(`/api/questions/${questionId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed, author_name: authorName.trim() || null }),
    });

    if (res.ok) {
      const created: Reply = await res.json();
      setReplies((prev) => [...prev, created]);
      setContent("");
      setAuthorName("");
      setShowForm(false);
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-2 space-y-2">
      {replies.length > 0 && (
        <div className="ml-2 border-l-2 border-border pl-4 space-y-2">
          {replies.map((r) => (
            <div key={r.id}>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {r.author_name ?? "Anonymous"}
                </span>
                <span className="text-[10px] text-muted">{formatTime(r.created_at)}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/40"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postReply(); }}
            placeholder="Write a reply… (Ctrl+Enter to submit)"
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/40 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={postReply}
              disabled={submitting || !content.trim()}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-brand-strong disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post Reply"}
            </button>
            <button
              onClick={() => { setShowForm(false); setContent(""); setAuthorName(""); }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs transition-all hover:bg-background"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-brand font-medium hover:underline"
        >
          {replies.length > 0 ? "+ Add reply" : "Reply"}
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  // Debounced search
  useEffect(() => {
    const id = setTimeout(async () => {
      const url = query
        ? `/api/questions?q=${encodeURIComponent(query)}`
        : `/api/questions`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setHasMore(data.hasMore ?? false);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  function improveDraft() {
    const text = draft.trim();
    if (!text) return;
    const normalized = text.replace(/\s+/g, " ").trim();
    const capitalized = normalized[0].toUpperCase() + normalized.slice(1);
    setDraft(/[?.!]$/.test(capitalized) ? capitalized : `${capitalized}?`);
  }

  async function submit() {
    if (!draft.trim()) return;
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft.trim() }),
    });
    if (!res.ok) return;
    const created = await res.json();
    setQuestions((qs) => [{ ...created, votes: 0, pinned: false, answers: [] }, ...qs]);
    setDraft("");
  }

  async function togglePin(id: string, pinned: boolean) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, pinned } : q)));
    const res = await fetch(`/api/questions/${id}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    });
    if (!res.ok) {
      setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, pinned: !pinned } : q)));
    }
  }

  async function submitAnswer(questionId: string) {
    const text = answerText[questionId]?.trim();
    if (!text) return;

    const res = await fetch(`/api/questions/${questionId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (!res.ok) return;
    const created = await res.json();

    setQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: [
                ...(q.answers ?? []),
                { id: created.id, body: created.answer_text, author: null, reactions: {}, replies: [] },
              ],
            }
          : q
      )
    );
    setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
  }

  async function loadMore() {
    setLoading(true);
    const res = await fetch(`/api/questions?offset=${questions.length}`);
    const data = await res.json();
    setQuestions((qs) => [...qs, ...(data.questions ?? [])]);
    setHasMore(data.hasMore ?? false);
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

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50"
        />
        <span className="text-xs text-muted">{hydrated ? "Interactive ✓" : "Loading…"}</span>
      </div>

      {/* Questions */}
      <ul className="space-y-4">
        {sortedQuestions.map((q) => (
          <li key={q.id} className="rounded-2xl border border-border bg-surface p-5 shadow-md transition-all hover:shadow-lg">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium leading-relaxed text-foreground">{q.body}</p>
                {q.author && <p className="mt-1 text-xs text-muted">by {q.author}</p>}
              </div>
              <button
                onClick={() => togglePin(q.id, !q.pinned)}
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-all hover:border-brand hover:bg-brand/5"
              >
                {q.pinned ? "📌" : "📍"}
              </button>
            </div>

            {/* Reactions */}
            <QuestionReactions questionId={q.id} />

            {/* Answers */}
            <div className="mt-4 border-t border-border pt-4 space-y-3">
              <button
                onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                className="text-sm font-medium text-brand hover:underline"
              >
                {q.answers?.length ?? 0} Answer{(q.answers?.length ?? 0) !== 1 ? "s" : ""}
              </button>

              {expandedQuestion === q.id && (
                <div className="space-y-3">
                  {q.answers?.map((answer) => (
                    <div key={answer.id} className="rounded-lg border border-border bg-background p-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">{answer.body}</p>
                      {answer.author && <p className="text-xs text-muted">by {answer.author}</p>}
                      {/* Replies saved to Supabase replies table */}
                      <AnswerReplies questionId={q.id} />
                    </div>
                  ))}

                  {/* Add Answer */}
                  <div className="rounded-lg border border-border bg-background p-3">
                    <textarea
                      value={answerText[q.id] ?? ""}
                      onChange={(e) => setAnswerText({ ...answerText, [q.id]: e.target.value })}
                      placeholder="Write your answer…"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50 resize-none"
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
          <p className="text-sm text-muted">No questions yet. Be the first to ask something!</p>
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
