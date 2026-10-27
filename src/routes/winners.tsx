import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState } from "@/components/shared";
import { WinnerCard } from "@/components/Cards";
import { activeWinners } from "@/lib/queries";
import { Award } from "lucide-react";

export const Route = createFileRoute("/winners")({
  head: () => ({
    meta: [
      { title: "Winners — The Letter" },
      {
        name: "description",
        content: "Recognising the writers and voices awarded by The Letter.",
      },
      { property: "og:title", content: "Winners — The Letter" },
      {
        property: "og:description",
        content: "Recognising the writers and voices awarded by The Letter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WinnersPage,
});

function WinnersPage() {
  const { data: winners } = useSuspenseQuery(activeWinners(200));

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Recognised</p>
        <h1 className="font-display mt-1.5 text-3xl text-ink sm:text-4xl">Winners</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Every voice deserves its moment. These are ours.
        </p>

        <div className="mt-10">
          {winners.length === 0 ? (
            <EmptyState
              icon={<Award className="size-6" />}
              title="No winners yet"
              description="The first award is being decided."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {winners.map((w) => (
                <WinnerCard key={w.id} winner={w} />
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
