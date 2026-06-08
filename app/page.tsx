import KealviApp from "./kealvi-app";
import { getQuestionsPage } from "@/lib/questions";
import { getPolls } from "@/lib/polls";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function Page() {
  const [{ questions, hasMore }, polls] = await Promise.all([
    getQuestionsPage(0, PAGE_SIZE),
    getPolls(),
  ]);

  return (
    <KealviApp
      initialQuestions={questions}
      initialHasMore={hasMore}
      initialPolls={polls}
    />
  );
}
