import { Link } from "@tanstack/react-router";
import type { ProfileRow, ThoughtRow, WinnerRow } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/slugify";
import { Award, Quote } from "lucide-react";

export function ProfileCard({ profile }: { profile: ProfileRow }) {
  const photo = mediaUrl(profile.photo_url);
  const initials = profile.full_name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      to="/profiles/$id"
      params={{ id: profile.id }}
      className="card-shadow group flex h-full flex-col items-center rounded-3xl border border-border bg-card p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="size-20 overflow-hidden rounded-full border-2 border-primary/25 bg-secondary">
        {photo ? (
          <img
            src={photo}
            alt={profile.full_name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center font-display text-xl text-primary">
            {initials || "?"}
          </div>
        )}
      </div>
      <h3 className="font-display mt-4 text-base text-ink group-hover:text-primary">
        {profile.full_name}
      </h3>
      {profile.bio && (
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {profile.bio}
        </p>
      )}
    </Link>
  );
}

export function ThoughtCard({ thought }: { thought: ThoughtRow }) {
  return (
    <figure className="card-shadow flex h-full flex-col rounded-3xl border border-border bg-card p-6">
      <Quote className="size-6 text-primary" fill="currentColor" strokeWidth={0} />
      <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground/90">
        {thought.content}
      </blockquote>
      <figcaption className="mt-5 border-t border-border/70 pt-4 text-sm">
        <span className="font-semibold text-ink">— {thought.author_name}</span>
        {thought.published_at && (
          <span className="ml-2 text-xs text-muted-foreground">
            {formatDate(thought.published_at)}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

export function WinnerCard({ winner }: { winner: WinnerRow }) {
  const photo = mediaUrl(winner.photo_url);
  const initials = winner.full_name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="card-shadow flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card">
      <div className="relative aspect-[4/3] bg-secondary">
        {photo ? (
          <img
            src={photo}
            alt={winner.full_name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center bg-primary-soft">
            <span className="font-display text-3xl text-primary">{initials || <Award />}</span>
          </div>
        )}
        {winner.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
            Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
          <Award className="size-3.5" />
          {winner.category || "Winner"}
        </span>
        <h3 className="font-display mt-3 text-lg text-ink">{winner.full_name}</h3>
        <p className="mt-1 text-sm font-semibold text-primary">{winner.award_title}</p>
        {winner.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {winner.description}
          </p>
        )}
        {winner.award_date && (
          <p className="mt-auto pt-4 text-xs text-muted-foreground">
            Awarded {formatDate(winner.award_date)}
          </p>
        )}
      </div>
    </article>
  );
}
