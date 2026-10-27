import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { EmptyState } from "@/components/shared";
import { BlogCard } from "@/components/BlogCard";
import { ProfileCard, WinnerCard } from "@/components/Cards";
import { latestBlogs, activeProfiles, activeWinners, PAGE_SIZE } from "@/lib/queries";
import { Search } from "lucide-react";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import type { ReactNode } from "react";

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(z.object({ q: z.string().trim().max(120).optional() })),
  head: () => ({
    meta: [
      { title: "Search — The Letter" },
      { name: "description", content: "Search every letter, profile and winner." },
      { property: "og:title", content: "Search — The Letter" },
      { property: "og:description", content: "Search every letter, profile and winner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function matches(term: string, text: string | null | undefined) {
  return (text ?? "").toLowerCase().includes(term);
}

function SearchPage() {
  const { q } = Route.useSearch();
  const term = (q ?? "").trim().toLowerCase();

  const { data: blogs } = useSuspenseQuery(latestBlogs(50));
  const { data: profiles } = useSuspenseQuery(activeProfiles(200));
  const { data: winners } = useSuspenseQuery(activeWinners(200));

  if (!term) {
    return (
      <SiteLayout>
        <SearchIntro>
          <EmptyState
            icon={<Search className="size-6" />}
            title="Search The Letter"
            description="Find letters, writers and winners by name or keyword."
          />
        </SearchIntro>
      </SiteLayout>
    );
  }

  const foundBlogs = blogs.filter(
    (b) => matches(term, b.title) || matches(term, b.short_description) || matches(term, b.category) || matches(term, b.author?.full_name),
  );
  const foundProfiles = profiles.filter((p) => matches(term, p.full_name) || matches(term, p.bio));
  const foundWinners = winners.filter(
    (w) => matches(term, w.full_name) || matches(term, w.award_title) || matches(term, w.description),
  );
  const nothing = foundBlogs.length === 0 && foundProfiles.length === 0 && foundWinners.length === 0;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Search</p>
        <h1 className="font-display mt-1.5 text-3xl text-ink sm:text-4xl">
          Results for “{q}”
        </h1>

        {nothing ? (
          <div className="mt-10">
            <EmptyState
              icon={<Search className="size-6" />}
              title="Nothing matched"
              description="Try a different keyword."
            />
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {foundBlogs.length > 0 && (
              <section>
                <h2 className="font-display text-xl text-ink">Letters ({Math.min(foundBlogs.length, PAGE_SIZE)})</h2>
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {foundBlogs.slice(0, PAGE_SIZE).map((b) => (
                    <BlogCard key={b.id} blog={b} />
                  ))}
                </div>
              </section>
            )}
            {foundProfiles.length > 0 && (
              <section>
                <h2 className="font-display text-xl text-ink">Profiles ({foundProfiles.length})</h2>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                  {foundProfiles.map((p) => (
                    <ProfileCard key={p.id} profile={p} />
                  ))}
                </div>
              </section>
            )}
            {foundWinners.length > 0 && (
              <section>
                <h2 className="font-display text-xl text-ink">Winners ({foundWinners.length})</h2>
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {foundWinners.map((w) => (
                    <WinnerCard key={w.id} winner={w} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function SearchIntro({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Search</p>
      <h1 className="font-display mt-1.5 text-3xl text-ink sm:text-4xl">Find a letter</h1>
      <form action="/search" method="get" className="mt-6 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            autoFocus
            placeholder="Type a keyword…"
            className="w-full rounded-full border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Search
        </button>
      </form>
      <div className="mt-10">{children}</div>
    </div>
  );
}

export { Link };
