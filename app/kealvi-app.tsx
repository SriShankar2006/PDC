"use client";

import { useState, useEffect } from "react";
import QuestionsList from "./questions-list";
import PollsList from "./polls-list";
import ThemeToggle from "./theme-toggle";

type Answer = {
  id: string;
  body: string;
  author: string | null;
  reactions: Record<string, number>;
  replies: never[];
};

type Question = {
  id: string;
  body: string;
  author: string | null;
  votes: number;
  pinned?: boolean;
  answers?: Answer[];
};

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

type Tab = "questions" | "polls" | "reports";

// ─── Reports View ─────────────────────────────────────────────────────────────

function ReportsView({ questions, polls }: { questions: Question[]; polls: Poll[] }) {
  const pinnedCount = questions.filter((q) => q.pinned).length;

  const stats = [
    { label: "Total Questions", value: questions.length, icon: "💬" },
    { label: "Total Polls", value: polls.length, icon: "📊" },
    { label: "Pinned Questions", value: pinnedCount, icon: "📌" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label}
            className="rounded-2xl border border-border bg-surface p-5 shadow-md flex flex-col gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5">
            <span className="text-2xl">{stat.icon}</span>
            <span className="text-3xl font-bold text-foreground tabular-nums">{stat.value}</span>
            <span className="text-xs text-muted font-medium">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App Shell ───────────────────────────────────────────────────────────

export default function KealviApp({
  initialQuestions,
  initialHasMore,
  initialPolls,
}: {
  initialQuestions: Question[];
  initialHasMore: boolean;
  initialPolls: Poll[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("questions");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "questions", label: "Questions", icon: "💬" },
    { id: "polls",     label: "Polls",     icon: "📊" },
    { id: "reports",   label: "Reports",   icon: "📈" },
  ];

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Fixed Header — never moves on scroll ────────────── */}
      <header
        className={[
          "fixed top-0 left-0 right-0 z-50 transition-shadow duration-300",
          scrolled ? "shadow-lg shadow-black/5" : "",
        ].join(" ")}
        style={{
          background: "rgba(var(--header-bg, 245,246,251), 0.72)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(var(--header-border, 231,231,240), 0.6)",
        }}
      >
        {/* subtle top gradient line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-5 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0 select-none">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shadow-md shadow-brand/40">
              <span className="text-white text-xs font-bold">K</span>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-brand to-violet-500 bg-clip-text text-transparent">
              Kealvi
            </span>
          </div>

          {/* Live pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-brand/25 px-3 py-1 shrink-0"
            style={{ background: "rgba(91,84,232,0.08)" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            <span className="text-xs font-semibold text-brand">Live now</span>
          </div>

          {/* Tab navigation */}
          <nav className="flex items-center gap-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 outline-none",
                  activeTab === tab.id
                    ? "bg-brand text-white shadow-md shadow-brand/30"
                    : "text-muted hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10",
                ].join(" ")}
              >
                <span className="hidden sm:inline">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Theme toggle */}
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Page content — pt-[56px] offsets the fixed header height ── */}
      <div className="flex-1 mx-auto w-full max-w-4xl px-5 pt-[72px] pb-10">

        {/* Questions */}
        <div className={activeTab === "questions" ? "block" : "hidden"}>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 mb-3">
              <span className="h-2 w-2 rounded-full bg-brand" />
              <span className="text-xs font-semibold text-brand uppercase tracking-wide">Live Community</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Questions</h1>
            <p className="mt-2 text-muted text-sm">Ask anything, vote on what matters.</p>
          </div>
          <QuestionsList initialQuestions={initialQuestions} initialHasMore={initialHasMore} />
        </div>

        {/* Polls */}
        <div className={activeTab === "polls" ? "block" : "hidden"}>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 mb-3">
              <span className="h-2 w-2 rounded-full bg-brand" />
              <span className="text-xs font-semibold text-brand uppercase tracking-wide">Community Polls</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Polls</h1>
            <p className="mt-2 text-muted text-sm">Create polls and see what the community thinks.</p>
          </div>
          <PollsList initialPolls={initialPolls} />
        </div>

        {/* Reports */}
        <div className={activeTab === "reports" ? "block" : "hidden"}>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 mb-3">
              <span className="h-2 w-2 rounded-full bg-brand" />
              <span className="text-xs font-semibold text-brand uppercase tracking-wide">Analytics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Reports</h1>
            <p className="mt-2 text-muted text-sm">Live stats from the community at a glance.</p>
          </div>
          <ReportsView questions={initialQuestions} polls={initialPolls} />
        </div>

      </div>
    </div>
  );
}
