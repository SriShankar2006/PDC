"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type PollOption = {
  id: string;
  label: string;
  votes: number;
};

type Poll = {
  id: string;
  question: string;
  options: PollOption[];
};

export default function PollsList({ initialPolls }: { initialPolls: Poll[] }) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);
  // userVotes: pollId -> optionId the current voter chose
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [votesLoaded, setVotesLoaded] = useState(false);

  // AI Poll Generator State
  const [aiTopic, setAiTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiBox, setShowAiBox] = useState(false);
  const [aiError, setAiError] = useState("");

  // ── On mount: restore which options this voter already picked ──
  useEffect(() => {
    async function loadMyVotes() {
      const voterId = getVoterId();
      try {
        const res = await fetch(`/api/polls/my-votes?voterId=${encodeURIComponent(voterId)}`);
        if (!res.ok) return;
        const data: { pollId: string; optionId: string }[] = await res.json();
        const map: Record<string, string> = {};
        for (const { pollId, optionId } of data) {
          map[pollId] = optionId;
        }
        setUserVotes(map);
      } catch {
        // silently fail — user just won't see their previous highlight
      } finally {
        setVotesLoaded(true);
      }
    }
    loadMyVotes();
  }, []);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function getTotalVotes(poll: Poll) {
    return poll.options.reduce((sum, o) => sum + o.votes, 0);
  }

  function getPercentage(option: PollOption, total: number) {
    return total === 0 ? 0 : Math.round((option.votes / total) * 100);
  }

  async function generatePollWithAI() {
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/generate-poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic.trim() }),
      });
      if (!res.ok) throw new Error("Failed to compile layout elements.");
      const data = await res.json();
      if (data.question && Array.isArray(data.options)) {
        setQuestion(data.question);
        setOptions(data.options.map((opt: string) => String(opt)));
        setShowAiBox(false);
        setAiTopic("");
      } else {
        setAiError(data.error ?? "Invalid structure returned from AI.");
      }
    } catch {
      setAiError("Network error generating poll properties. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  }

  async function createPoll() {
    const trimmedQuestion = question.trim();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!trimmedQuestion || validOptions.length < 2) return;

    setSaving(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmedQuestion, options: validOptions }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setPolls((prev) => [created, ...prev]);
      setQuestion("");
      setOptions(["", ""]);
    } catch (err: unknown) {
      console.error("Failed to post poll instance:", err);
    } finally {
      setSaving(false);
    }
  }

  async function vote(pollId: string, optionId: string) {
    const prevOptionId = userVotes[pollId];
    if (prevOptionId === optionId) return;

    // Optimistic update
    setUserVotes((prev) => ({ ...prev, [pollId]: optionId }));
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        return {
          ...poll,
          options: poll.options.map((o) => {
            if (o.id === optionId) return { ...o, votes: o.votes + 1 };
            if (o.id === prevOptionId) return { ...o, votes: Math.max(0, o.votes - 1) };
            return o;
          }),
        };
      })
    );

    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId, voterId: getVoterId() }),
    });

    if (!res.ok) {
      // Rollback
      setUserVotes((prev) => {
        const next = { ...prev };
        if (prevOptionId) next[pollId] = prevOptionId;
        else delete next[pollId];
        return next;
      });
      setPolls((prev) =>
        prev.map((poll) => {
          if (poll.id !== pollId) return poll;
          return {
            ...poll,
            options: poll.options.map((o) => {
              if (o.id === optionId) return { ...o, votes: Math.max(0, o.votes - 1) };
              if (o.id === prevOptionId) return { ...o, votes: o.votes + 1 };
              return o;
            }),
          };
        })
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Poll */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create a Poll</h2>
          <button
            type="button"
            onClick={() => setShowAiBox(!showAiBox)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand/40 bg-brand/5 px-4 py-2 text-sm font-medium text-brand transition-all hover:bg-brand/10"
          >
            ✨ {showAiBox ? "Manual Mode" : "Generate with AI"}
          </button>
        </div>

        {showAiBox && (
          <div className="mb-4 rounded-xl border border-brand/30 bg-brand/5 p-4 space-y-3 animate-fadeIn">
            <p className="text-xs font-semibold text-brand">✨ AI Poll Generator</p>
            <p className="text-xs text-muted">
              Enter a topic and AI will automatically build a context-based poll question and set of responses.
            </p>
            <div className="flex gap-2">
              <input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generatePollWithAI()}
                placeholder="e.g. Next.js vs Vite, dark mode vs light mode, tea vs coffee…"
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50"
              />
              <button
                type="button"
                onClick={generatePollWithAI}
                disabled={aiGenerating || !aiTopic.trim()}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-strong disabled:opacity-50"
              >
                {aiGenerating ? "Generating…" : "Generate"}
              </button>
            </div>
            {aiError && <p className="text-xs text-red-500 mt-1">{aiError}</p>}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Poll Question</label>
            <div className="neon-border-wrap">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to poll the community on?"
                className="neon-input w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">Options</label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="rounded-lg border border-border px-2.5 py-2 text-sm text-muted hover:border-red-400 hover:text-red-400 transition-all"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={addOption}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-all hover:border-brand hover:bg-brand/5"
            >
              + Add option
            </button>
            <button
              type="button"
              onClick={createPoll}
              disabled={saving || !question.trim()}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-strong hover:shadow-lg disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Poll"}
            </button>
          </div>
        </div>
      </div>

      {/* Active Polls */}
      {polls.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Active Polls</h2>
          <div className="space-y-4">
            {polls.map((poll) => {
              const totalVotes = getTotalVotes(poll);
              return (
                <div
                  key={poll.id}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-md transition-all hover:shadow-lg"
                >
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold text-foreground">{poll.question}</h3>
                    <p className="mt-2 text-sm text-muted">
                      {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = getPercentage(option, totalVotes);
                      const isVoted = votesLoaded && userVotes[poll.id] === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => vote(poll.id, option.id)}
                          className={`w-full rounded-xl border transition-all text-left ${
                            isVoted
                              ? "border-brand bg-brand/5"
                              : "border-border hover:border-brand hover:bg-background"
                          }`}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <span className="font-medium text-foreground flex items-center gap-2">
                                {option.label}
                                {isVoted && (
                                  <span className="text-xs font-semibold text-brand bg-brand/10 rounded-full px-2 py-0.5">
                                    ✓ Your vote
                                  </span>
                                )}
                              </span>
                              <span className="text-sm font-semibold tabular-nums text-brand">
                                {percentage}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 overflow-hidden rounded-full bg-border">
                                <div
                                  className="h-2 rounded-full bg-brand transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted tabular-nums w-12 text-right">
                                {option.votes}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
