import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BlogCard } from "@/components/BlogCard";
import { EmptyState, GridSkeleton } from "@/components/shared";
import { publishedBlogsInfinite, blogCategories } from "@/lib/queries";
import { Newspaper, Search } from "lucide-react";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

export const Route = createFileRoute("/blogs")({
  validateSearch: zodValidator(
    z.object({
      q: z.string().trim().max(120).optional(),
      category: z.string().trim().max(80).optional(),
    }),
  ),
  head: () => ({
    meta: [
      { title: "Blogs — The Letter" },
      {
        name: "description",
        content: "Every letter we've sent. Stories, essays and notes from The Letter.",
      },
      { property: "og:title", content: "Blogs — The Letter" },
      {
        property: "og:description",
        content: "Every letter we've sent. Stories, essays and notes from The Letter.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogsPage,
});

function BlogsPage() {
  const navigate = useNavigate();
  const { q, category } = Route.useSearch();
  const [searchInput, setSearchInput] = useState(q ?? "");

  const { data: categories } = useSuspenseQuery(blogCategories);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(publishedBlogsInfinite({ q, category }));

  const blogs = data.pages.flat();

  const applyFilter = (nextCategory?: string) => {
    navigate({
      to: "/blogs",
      search: (prev) => ({ ...prev, category: nextCategory || undefined }),
    });
  };

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/blogs", search: (prev) => ({ ...prev, q: searchInput || undefined }) });
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">The archive</p>
        <h1 className="font-display mt-1.5 text-3xl text-ink sm:text-4xl">Blogs</h1>

        <form onSubmit={applySearch} className="mt-6 flex max-w-md gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search letters…"
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

        {categories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyFilter()}
              className={
                !category
                  ? "rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground"
                  : "rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground/70 hover:border-primary/40"
              }
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => applyFilter(c)}
                className={
                  category === c
                    ? "rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground"
                    : "rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground/70 hover:border-primary/40"
                }
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {blogs.length === 0 ? (
            <EmptyState
              icon={<Newspaper className="size-6" />}
              title={q || category ? "Nothing matched" : "No letters yet"}
              description={
                q || category
                  ? "Try a different search or browse all letters."
                  : "The first letter is on its way."
              }
              action={
                (q || category) && (
                  <Link to="/blogs" className="text-sm font-semibold text-primary hover:underline">
                    Clear filters
                  </Link>
                )
              }
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {blogs.map((b) => (
                  <BlogCard key={b.id} blog={b} />
                ))}
              </div>
              {hasNextPage && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-full border border-primary px-7 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

export { GridSkeleton };
