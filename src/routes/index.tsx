import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeading, EmptyState } from "@/components/shared";
import { BlogCard } from "@/components/BlogCard";
import { ProfileCard, ThoughtCard, WinnerCard } from "@/components/Cards";
import { featuredBlogs, latestBlogs, activeProfiles, publishedThoughts, activeWinners } from "@/lib/queries";
import { Send, Newspaper, UsersRound, Quote, Award } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <SiteLayout>
      <Hero />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6">
        <FeaturedSection />
        <LatestSection />
        <ProfilesSection />
        <ThoughtSection />
        <WinnersSection />
        <SubmitCta />
      </div>
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
      <div className="hero-gradient relative overflow-hidden rounded-4xl px-6 py-14 text-white sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl"
        />
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/80">
          Stories · Thoughts · Voices
        </p>
        <h1 className="font-display mt-4 max-w-2xl text-4xl uppercase leading-[1.05] sm:text-6xl">
          Words that travel further than footsteps
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85">
          A letter from us to the world — crafted for the ones who read between the lines.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-foreground transition-transform hover:scale-[1.03]"
          >
            <Newspaper className="size-4" /> Read the latest
          </Link>
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            <Send className="size-4" /> Submit your work
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedSection() {
  const { data: blogs } = useSuspenseQuery(featuredBlogs(2));
  if (blogs.length === 0) return null;
  return (
    <section>
      <SectionHeading
        eyebrow="Editor's picks"
        title="Featured"
        action={
          <Link to="/blogs" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        }
      />
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {blogs.map((b) => (
          <BlogCard key={b.id} blog={b} featured />
        ))}
      </div>
    </section>
  );
}

function LatestSection() {
  const { data: blogs } = useSuspenseQuery(latestBlogs(6));
  return (
    <section>
      <SectionHeading
        eyebrow="Fresh off the press"
        title="Latest letters"
        action={
          <Link to="/blogs" className="text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        }
      />
      {blogs.length === 0 ? (
        <EmptyState
          icon={<Newspaper className="size-6" />}
          title="No letters yet"
          description="The first letter is on its way. Check back soon."
        />
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((b) => (
            <BlogCard key={b.id} blog={b} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProfilesSection() {
  const { data: profiles } = useSuspenseQuery(activeProfiles(4));
  if (profiles.length === 0) return null;
  return (
    <section>
      <SectionHeading
        eyebrow="The voices"
        title="Meet our writers"
        action={
          <Link to="/profiles" className="text-sm font-semibold text-primary hover:underline">
            All profiles
          </Link>
        }
      />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {profiles.map((p) => (
          <ProfileCard key={p.id} profile={p} />
        ))}
      </div>
    </section>
  );
}

function ThoughtSection() {
  const { data: thoughts } = useSuspenseQuery(publishedThoughts(3));
  if (thoughts.length === 0) return null;
  return (
    <section>
      <SectionHeading
        eyebrow="In a sentence"
        title="Thoughts"
        action={
          <Link to="/thought" className="text-sm font-semibold text-primary hover:underline">
            All thoughts
          </Link>
        }
      />
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {thoughts.map((t) => (
          <ThoughtCard key={t.id} thought={t} />
        ))}
      </div>
    </section>
  );
}

function WinnersSection() {
  const { data: winners } = useSuspenseQuery(activeWinners(3));
  if (winners.length === 0) return null;
  return (
    <section>
      <SectionHeading
        eyebrow="Recognised"
        title="Winners"
        action={
          <Link to="/winners" className="text-sm font-semibold text-primary hover:underline">
            All winners
          </Link>
        }
      />
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {winners.map((w) => (
          <WinnerCard key={w.id} winner={w} />
        ))}
      </div>
    </section>
  );
}

function SubmitCta() {
  return (
    <section className="hero-gradient rounded-4xl px-6 py-12 text-center text-white sm:px-12">
      <Quote className="mx-auto size-8 text-white/80" fill="currentColor" strokeWidth={0} />
      <h2 className="font-display mt-4 text-3xl uppercase sm:text-4xl">
        Have something to say?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/85">
        Send us your writing, your photographs, your letter. If it moves us, it moves the world.
      </p>
      <Link
        to="/submit"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-foreground transition-transform hover:scale-[1.03]"
      >
        <Send className="size-4" /> Submit your work
      </Link>
    </section>
  );
}

export { Award };
