import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState } from "@/components/shared";
import { ThoughtCard } from "@/components/Cards";
import { publishedThoughts } from "@/lib/queries";
import { Quote } from "lucide-react";

export const Route = createFileRoute("/thought")({
  head: () => ({
    meta: [
      { title: "Thoughts — The Letter" },
      { name: "description", content: "Short thoughts and one-liners worth keeping — from The Letter." },
      { property: "og:title", content: "Thoughts — The Letter" },
      {
        property: "og:description",
        content: "Short thoughts and one-liners worth keeping — from The Letter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThoughtPage,
});

function ThoughtPage() {
  const { data: thoughts } = useSuspenseQuery(publishedThoughts(100));

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">In a sentence</p>
        <h1 className="font-display mt-1.5 text-3xl text-ink sm:text-4xl">Thoughts</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Small thoughts, kept large. One sentence at a time.
        </p>

        <div className="mt-10">
          {thoughts.length === 0 ? (
            <EmptyState
              icon={<Quote className="size-6" />}
              title="No thoughts yet"
              description="The first thought is being written right now."
            />
          ) : (
            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
              {thoughts.map((t) => (
                <div key={t.id} className="break-inside-avoid">
                  <ThoughtCard thought={t} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
