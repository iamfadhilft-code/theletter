import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeading, EmptyState } from "@/components/shared";
import { BlogCard } from "@/components/BlogCard";
import { profileById, profileBlogs } from "@/lib/queries";
import { mediaUrl } from "@/lib/media";
import { UserRound, Newspaper } from "lucide-react";

export const Route = createFileRoute("/profiles/$id")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(profileById(params.id)),
  errorComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={<UserRound className="size-6" />}
          title="Profile not found"
          description="This profile may have been removed."
          action={
            <Link to="/profiles" className="text-sm font-semibold text-primary hover:underline">
              Back to profiles
            </Link>
          }
        />
      </div>
    </SiteLayout>
  ),
  head: ({ loaderData }) => {
    // loaderData is undefined when the loader threw (e.g. unknown profile).
    const name = loaderData?.full_name ?? "Profile";
    const description =
      loaderData?.bio ?? `Writings by ${name} for The Letter.`;
    return {
    meta: [
      { title: `${name} — The Letter` },
      { name: "description", content: description },
      { property: "og:title", content: `${name} — The Letter` },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
    };
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { id } = Route.useParams();
  const { data: profile } = useSuspenseQuery(profileById(id));
  const { data: blogs } = useSuspenseQuery(profileBlogs(profile.id));

  const photo = mediaUrl(profile.photo_url);
  const initials = profile.full_name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="card-shadow flex flex-col items-center gap-6 rounded-3xl border border-border bg-card p-8 text-center sm:flex-row sm:text-left">
          <div className="size-24 shrink-0 overflow-hidden rounded-full border-2 border-primary/25 bg-secondary">
            {photo ? (
              <img src={photo} alt={profile.full_name} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center font-display text-2xl text-primary">
                {initials || <UserRound className="size-8" />}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl text-ink sm:text-3xl">{profile.full_name}</h1>
            {profile.bio && (
              <p className="mt-2 leading-relaxed text-muted-foreground">{profile.bio}</p>
            )}
            {profile.details && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{profile.details}</p>
            )}
          </div>
        </div>

        <section className="mt-12">
          <SectionHeading eyebrow="Published" title={`Letters by ${profile.full_name}`} />
          {blogs.length === 0 ? (
            <EmptyState
              icon={<Newspaper className="size-6" />}
              title="No letters yet"
              description="This writer hasn't published yet."
            />
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map((b) => (
                <BlogCard key={b.id} blog={b} />
              ))}
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}
