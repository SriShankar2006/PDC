"use client";

import { useState, useEffect, useCallback } from "react";
import type { Reply, ReactionCounts } from "@/lib/types";

const EMOJIS = ["👍", "❤️", "😂", "😮", "🎉"] as const;

// Simple persistent userId per browser session
function getUserId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("kealvi_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("kealvi_user_id", id);
  }
  return id;
}

// ─── Reaction Bar ────────────────────────────────────────────────────────────

function ReactionBar({ questionId }: { questionId: string }) {
  const [counts, setCounts] = useState<ReactionCounts>({});
  const [reacted, setReacted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchReactions = useCallback(async () => {
    const res = await fetch(`/api/questions/${questionId}/reaction`);
    if (res.ok) setCounts(await res.json());
  }, [questionId]);

  useEffect(() => { fetchReactions(); }, [fetchReactions]);

  async function handleReact(emoji: string) {
    if (loading) return;
    setLoading(true);

    const userId = getUserId();

    // Optimistic update
    setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
    setReacted((prev) => new Set([...prev, emoji]));

    const res = await fetch(`/api/questions/${questionId}/reaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji, userId }),
    });

    if (!res.ok) {
      // Rollback on error
      setCounts((prev) => ({ ...prev, [emoji]: Math.max((prev[emoji] ?? 1) - 1, 0) }));
      setReacted((prev) => { const s = new Set(prev); s.delete(emoji); return s; });
    } else {
      await fetchReactions(); // sync real counts
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {EMOJIS.map((emoji) => {
        const count = counts[emoji] ?? 0;
        const active = reacted.has(emoji);
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            disabled={loading}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
              border transition-all duration-150 select-none
              ${active
                ? "bg-brand/15 border-brand text-brand scale-105"
                : "border-border text-muted hover:border-brand hover:bg-brand/5 hover:text-foreground"
              }
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            <span>{emoji}</span>
            {count > 0 && (
              <span className={`text-xs font-semibold tabular-nums ${active ? "text-brand" : "text-muted"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Reply Form ──────────────────────────────────────────────────────────────

function ReplyForm({
  questionId,
  onPosted,
}: {
  questionId: string;
  onPosted: (reply: Reply) => void;
}) {
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/questions/${questionId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed, author_name: authorName.trim() || null }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Failed to post reply.");
    } else {
      const created: Reply = await res.json();
      onPosted(created);
      setContent("");
      setAuthorName("");
    }

    setSubmitting(false);
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-4 space-y-3">
      <input
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/40 transition"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
        placeholder="Write a reply… (Ctrl+Enter to submit)"
        rows={3}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/40 transition resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting || !content.trim()}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Posting…" : "Post Reply"}
      </button>
    </div>
  );
}

// ─── Replies List ────────────────────────────────────────────────────────────

function RepliesList({ questionId }: { questionId: string }) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`/api/questions/${questionId}/reply`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReplies(data);
      })
      .finally(() => setLoading(false));
  }, [questionId]);

  function handlePosted(reply: Reply) {
    setReplies((prev) => [...prev, reply]);
    setShowForm(false);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="mt-4 space-y-2">
      {loading ? (
        <p className="text-xs text-muted animate-pulse">Loading replies…</p>
      ) : (
        <>
          {replies.length > 0 && (
            <div className="space-y-2 border-l-2 border-border pl-4">
              {replies.map((r) => (
                <div key={r.id} className="space-y-0.5">
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

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-medium text-brand hover:underline mt-1"
            >
              {replies.length > 0 ? `+ Add reply` : `Be the first to reply`}
            </button>
          ) : (
            <>
              <ReplyForm questionId={questionId} onPosted={handlePosted} />
              <button
                onClick={() => setShowForm(false)}
                className="text-xs text-muted hover:text-foreground"
              >
                Cancel
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Export: Question Interactions ──────────────────────────────────────

export default function QuestionInteractions({ questionId }: { questionId: string }) {
  return (
    <div className="mt-4 pt-4 border-t border-border space-y-1">
      <ReactionBar questionId={questionId} />
      <RepliesList questionId={questionId} />
    </div>
  );
}
