import { Link } from "@tanstack/react-router";
import { CalendarDays, UserRound } from "lucide-react";
import type { BlogRow } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/slugify";

export function BlogCard({ blog, featured = false }: { blog: BlogRow; featured?: boolean }) {
  const cover = mediaUrl(blog.cover_image_url);

  return (
    <Link
      to="/blogs/$slug"
      params={{ slug: blog.slug }}
      className="card-shadow group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        {cover ? (
          <img
            src={cover}
            alt={blog.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="hero-gradient flex size-full items-center justify-center">
            <span className="font-display text-2xl uppercase text-white/90">
              {blog.category ?? "The Letter"}
            </span>
          </div>
        )}
        {featured && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        {blog.category && (
          <span className="w-fit rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
            {blog.category}
          </span>
        )}
        <h3 className="font-display mt-3 text-lg leading-snug text-ink transition-colors group-hover:text-primary">
          {blog.title}
        </h3>
        {blog.short_description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {blog.short_description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted-foreground">
          {blog.author?.full_name && (
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="size-3.5" />
              {blog.author.full_name}
            </span>
          )}
          {blog.published_at && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatDate(blog.published_at)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
