import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProfileCard, EmptyState } from "@/components/shared";
import { activeProfiles } from "@/lib/queries";
import { UsersRound, Search } from "lucide-react";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

export const Route = createFileRoute("/profiles")({
  validateSearch: zodValidator(z.object({ q: z.string().trim().max(120).optional() })),
  head: () => ({
    meta: [
      { title: "Profiles — The Letter" },
      { name: "description", content: "The voices behind The Letter — writers, thinkers, contributors." },
      { property: "og:title", content: "Profiles — The Letter" },
      {
        property: "og:description",
        content: "The voices behind The Letter — writers, thinkers, contributors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilesPage,
});

function ProfilesPage() {
  const navigate = useNavigate();
  const { q } = Route.useSearch();
  const { data: all } = useSuspenseQuery(activeProfiles(200));

  const term = (q ?? "").toLowerCase();
  const profiles = term
    ? all.filter(
        (p) =>
          p.full_name.toLowerCase().includes(term) ||
          (p.bio ?? "").toLowerCase().includes(term),
      )
    : all;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">The voices</p>
        <h1 className="font-display mt-1.5 text-3xl text-ink sm:text-4xl">Profiles</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
            navigate({ to: "/profiles", search: { q: input || undefined } });
          }}
          className="mt-6 flex max-w-md gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search profiles…"
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

        <div className="mt-8">
          {profiles.length === 0 ? (
            <EmptyState
              icon={<UsersRound className="size-6" />}
              title={term ? "No matching profiles" : "No profiles yet"}
              description={term ? "Try a different name." : "Writers will appear here soon."}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {profiles.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
