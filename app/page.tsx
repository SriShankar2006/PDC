import QuestionsList from "./questions-list";
import PollsList from "./polls-list";
import { getQuestionsPage } from "@/lib/questions";
import { getPolls } from "@/lib/polls";

// Render on every request (don't cache/prerender) so new data shows up.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

// Server component — runs only on the server, awaits the data, renders to HTML.
export default async function Page() {
  const [{ questions, hasMore }, polls] = await Promise.all([
    getQuestionsPage(0, PAGE_SIZE),
    getPolls(),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-16">
      {/* Header Section */}
      <section className="mb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-1.5 mb-4">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span className="text-xs font-semibold text-brand uppercase tracking-wide">Live Community</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
          Live Q&amp;A
        </h1>
        <p className="text-lg text-muted max-w-2xl">
          Ask questions, upvote answers, create polls, and connect with the community in real-time.
        </p>
      </section>

      {/* Questions Section */}
      <section className="mb-16">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Questions</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            {questions.length}
          </span>
        </div>
        <QuestionsList initialQuestions={questions} initialHasMore={hasMore} />
      </section>

      {/* Polls Section */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Polls</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
            {polls.length}
          </span>
        </div>
        <PollsList initialPolls={polls} />
      </section>
    </main>
  );
}
