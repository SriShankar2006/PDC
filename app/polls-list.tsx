"use client";
import { useState } from "react";
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
  const [userVotes, setUserVotes] = useState<{ [key: string]: string }>({});

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  }

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function getTotalVotes(poll: Poll) {
    return poll.options.reduce((sum, option) => sum + option.votes, 0);
  }

  function getPercentage(option: PollOption, total: number) {
    return total === 0 ? 0 : Math.round((option.votes / total) * 100);
  }

  async function createPoll() {
    const trimmedQuestion = question.trim();
    const validOptions = options.map((option) => option.trim()).filter(Boolean);
    if (!trimmedQuestion || validOptions.length < 2) return;

    setSaving(true);
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: trimmedQuestion, options: validOptions }),
    });
    setSaving(false);

    if (!res.ok) return;

    const created = await res.json();
    setPolls((prev) => [{ ...created, options: created.options }, ...prev]);
    setQuestion("");
    setOptions(["", ""]);
  }

  async function vote(pollId: string, optionId: string) {
    setUserVotes((prev) => ({ ...prev, [pollId]: optionId }));
    
    setPolls((prev) =>
      prev.map((poll) =>
        poll.id === pollId
          ? {
              ...poll,
              options: poll.options.map((option) => ({
                ...option,
                votes: option.id === optionId ? option.votes + 1 : option.votes,
              })),
            }
          : poll
      )
    );

    await fetch(`/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId, voterId: getVoterId() }),
    });
  }

  return (
    <div className="space-y-6">
      {/* Create Poll Section */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Create a Poll</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Poll Question</label>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What would you like to ask?"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50"
            />
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index}>
                <label className="block text-sm font-medium mb-2">Option {index + 1}</label>
                <input
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand/50"
                />
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
              disabled={saving}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-strong hover:shadow-lg disabled:opacity-50"
            >
              Create Poll
            </button>
          </div>
        </div>
      </div>

      {/* Active Polls Section */}
      {polls.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Active Polls</h2>
          <div className="space-y-4">
            {polls.map((poll) => {
              const totalVotes = getTotalVotes(poll);
              return (
                <div key={poll.id} className="rounded-2xl border border-border bg-surface p-6 shadow-md">
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold text-foreground">
                      {poll.question}
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = getPercentage(option, totalVotes);
                      const isVoted = userVotes[poll.id] === option.id;
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
                              <span className="font-medium text-foreground">
                                {option.label}
                              </span>
                              <span className="text-sm font-semibold tabular-nums text-brand">
                                {percentage}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 overflow-hidden rounded-full bg-border">
                                <div
                                  className="h-2 rounded-full bg-brand transition-all"
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
