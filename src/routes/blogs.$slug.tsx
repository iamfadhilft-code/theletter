import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { SectionHeading } from "@/components/shared";
import { BlogCard } from "@/components/BlogCard";
import { blogBySlug, relatedBlogs } from "@/lib/queries";
import { mediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/slugify";
import { CalendarDays, UserRound, ArrowLeft, Newspaper } from "lucide-react";
import { EmptyState } from "@/components/shared";

export const Route = createFileRoute("/blogs/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(blogBySlug(params.slug)),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <EmptyState
          icon={<Newspaper className="size-6" />}
          title="Letter not found"
          description={
            error instanceof Error ? error.message : "This letter may have been moved or unpublished."
          }
          action={
            <Link to="/blogs" className="text-sm font-semibold text-primary hover:underline">
              Back to all blogs
            </Link>
          }
        />
      </div>
    </SiteLayout>
  ),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData.title} — The Letter` },
      {
        name: "description",
        content: loaderData.short_description ?? "A letter from The Letter.",
      },
      { property: "og:title", content: `${loaderData.title} — The Letter` },
      {
        property: "og:description",
        content: loaderData.short_description ?? "A letter from The Letter.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArticlePage,
});

/** Rich text is stored as HTML by the editor; plain text becomes paragraphs. */
function ArticleBody({ content }: { content: string }) {
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return (
      <div
        className="prose-letter text-[15px] text-foreground/90 sm:text-base"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <div className="prose-letter text-[15px] text-foreground/90 sm:text-base">
      {content.split(/\n{2,}/).map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  );
}

function Gallery({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      {urls.map((u, i) => {
        const src = mediaUrl(u);
        return src ? (
          <img
            key={i}
            src={src}
            alt={`Article image ${i + 1}`}
            loading="lazy"
            className="card-shadow w-full rounded-2xl border border-border object-cover"
          />
        ) : null;
      })}
    </div>
  );
}

function ArticlePage() {
  const { slug } = Route.useParams();
  const { data: blog } = useSuspenseQuery(blogBySlug(slug));
  const { data: related } = useSuspenseQuery(relatedBlogs(blog.id, blog.category));

  const cover = mediaUrl(blog.cover_image_url);
  const gallery = (blog.image_urls ?? []).filter(Boolean);

  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> All blogs
        </Link>

        {blog.category && (
          <span className="mt-6 inline-flex rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
            {blog.category}
          </span>
        )}
        <h1 className="font-display mt-4 text-3xl leading-tight text-ink sm:text-5xl">
          {blog.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
          {blog.author?.full_name && (
            <span className="inline-flex items-center gap-2">
              <UserRound className="size-4" />
              {blog.author.full_name}
            </span>
          )}
          {blog.published_at && (
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" />
              {formatDate(blog.published_at)}
            </span>
          )}
        </div>

        {cover && (
          <img
            src={cover}
            alt={blog.title}
            className="card-shadow mt-8 aspect-[16/9] w-full rounded-3xl border border-border object-cover"
          />
        )}

        {blog.short_description && (
          <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
            {blog.short_description}
          </p>
        )}

        <div className="mt-6">
          <ArticleBody content={blog.content} />
        </div>

        <Gallery urls={gallery} />
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <SectionHeading eyebrow="Keep reading" title="Related letters" />
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((b) => (
              <BlogCard key={b.id} blog={b} />
            ))}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
