import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageManager } from "@/components/admin/ImageManager";
import { EmptyState } from "@/components/shared";
import { mediaUrl } from "@/lib/media";
import { uniqueSlug, formatDate } from "@/lib/slugify";
import type { BlogRow, ProfileRow, ContentStatus } from "@/lib/types";
import { Plus, Pencil, Trash2, Loader2, Newspaper, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/blogs")({
  head: () => ({ meta: [{ title: "Manage blogs — The Letter" }] }),
  component: AdminBlogs,
});

interface BlogForm {
  id?: string;
  title: string;
  category: string;
  short_description: string;
  content: string;
  cover_image_url: string | null;
  image_urls: string[];
  author_id: string | null;
  status: ContentStatus;
  featured: boolean;
  sort_order: number;
}

const EMPTY: BlogForm = {
  title: "",
  category: "",
  short_description: "",
  content: "",
  cover_image_url: null,
  image_urls: [],
  author_id: null,
  status: "draft",
  featured: false,
  sort_order: 0,
};

const blogsQuery = {
  queryKey: ["admin", "blogs"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("blogs")
      .select("*, author:profiles(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as BlogRow[];
  },
};

function AdminBlogs() {
  const queryClient = useQueryClient();
  const { data: blogs } = useSuspenseQuery(blogsQuery);
  const { data: profiles } = useSuspenseQuery({
    queryKey: ["admin", "profiles-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return data as unknown as ProfileRow[];
    },
  });

  const [editing, setEditing] = useState<BlogForm | null>(null);
  const [open, setOpen] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
    queryClient.invalidateQueries({ queryKey: ["blogs"] });
  };

  const save = useMutation({
    mutationFn: async (form: BlogForm) => {
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.content.trim()) throw new Error("Content is required");
      const payload = {
        title: form.title.trim(),
        category: form.category.trim() || null,
        short_description: form.short_description.trim() || null,
        content: form.content,
        cover_image_url: form.cover_image_url,
        image_urls: form.image_urls.length ? form.image_urls : null,
        author_id: form.author_id,
        status: form.status,
        featured: form.featured,
        sort_order: form.sort_order,
        ...(form.status === "published" ? { published_at: new Date().toISOString() } : { published_at: null }),
      };
      if (form.id) {
        const { error } = await supabase.from("blogs").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const slug = await uniqueSlug("blogs", payload.title);
        const { error } = await supabase.from("blogs").insert({ ...payload, slug });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Blog saved");
      invalidate();
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const togglePublish = useMutation({
    mutationFn: async (blog: BlogRow) => {
      const next: ContentStatus = blog.status === "published" ? "draft" : "published";
      const { error } = await supabase
        .from("blogs")
        .update({
          status: next,
          published_at:
            next === "published" ? (blog.published_at ?? new Date().toISOString()) : null,
        })
        .eq("id", blog.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const toggleFeatured = useMutation({
    mutationFn: async (blog: BlogRow) => {
      const { error } = await supabase
        .from("blogs")
        .update({ featured: !blog.featured })
        .eq("id", blog.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Updated");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Blog deleted");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Blogs</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" /> New blog
        </button>
      </div>

      {blogs.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Newspaper className="size-6" />}
            title="No blogs yet"
            description="Write the first letter."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {blogs.map((b) => {
            const cover = mediaUrl(b.cover_image_url);
            return (
              <li
                key={b.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="hidden size-12 shrink-0 overflow-hidden rounded-xl bg-secondary sm:block">
                  {cover && <img src={cover} alt="" className="size-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{b.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.category ?? "Uncategorised"} ·{" "}
                    {b.published_at ? formatDate(b.published_at) : "Not published"}
                  </p>
                </div>
                <span
                  className={
                    b.status === "published"
                      ? "shrink-0 rounded-full bg-primary-soft px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground"
                      : "shrink-0 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground"
                  }
                >
                  {b.status}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={b.featured ? "Unfeature" : "Feature"}
                    onClick={() => toggleFeatured.mutate(b)}
                    className={
                      b.featured
                        ? "grid size-9 place-items-center rounded-full text-primary"
                        : "grid size-9 place-items-center rounded-full text-muted-foreground hover:text-primary"
                    }
                  >
                    <Star className={b.featured ? "size-4" : "size-4"} fill={b.featured ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    aria-label={b.status === "published" ? "Unpublish" : "Publish"}
                    onClick={() => togglePublish.mutate(b)}
                    className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    {b.status === "published" ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => {
                      setEditing({
                        id: b.id,
                        title: b.title,
                        category: b.category ?? "",
                        short_description: b.short_description ?? "",
                        content: b.content,
                        cover_image_url: b.cover_image_url,
                        image_urls: b.image_urls ?? [],
                        author_id: b.author_id,
                        status: b.status,
                        featured: b.featured,
                        sort_order: b.sort_order,
                      });
                      setOpen(true);
                    }}
                    className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => {
                      if (window.confirm(`Delete "${b.title}"?`)) remove.mutate(b.id);
                    }}
                    className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {open && (
        <BlogDialog
          form={editing}
          profiles={profiles}
          saving={save.isPending}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={(f) => save.mutate(f)}
        />
      )}
    </div>
  );
}

function BlogDialog({
  form,
  profiles,
  saving,
  onClose,
  onSave,
}: {
  form: BlogForm | null;
  profiles: ProfileRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (form: BlogForm) => void;
}) {
  const [f, setF] = useState<BlogForm>(form ?? EMPTY);
  const set = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-2xl rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{form ? "Edit blog" : "New blog"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title *</span>
            <input
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</span>
              <input
                value={f.category}
                onChange={(e) => set("category", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Author</span>
              <select
                value={f.author_id ?? ""}
                onChange={(e) => set("author_id", e.target.value || null)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">No author</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Short description</span>
            <input
              value={f.short_description}
              onChange={(e) => set("short_description", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content * (HTML or plain paragraphs)</span>
            <textarea
              rows={12}
              value={f.content}
              onChange={(e) => set("content", e.target.value)}
              className="mt-1.5 w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 font-mono text-xs leading-relaxed outline-none focus:border-primary"
            />
          </label>

          <ImageManager
            label="Cover image"
            paths={f.cover_image_url ? [f.cover_image_url] : []}
            onChange={(paths) => set("cover_image_url", paths[0] ?? null)}
          />

          <ImageManager
            label="Additional images"
            multiple
            paths={f.image_urls}
            onChange={(paths) => set("image_urls", paths)}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</span>
              <select
                value={f.status}
                onChange={(e) => set("status", e.target.value as ContentStatus)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display order</span>
              <input
                type="number"
                value={f.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={f.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            <span className="text-sm font-semibold text-ink">Featured on home page</span>
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(f)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save blog
          </button>
        </div>
      </div>
    </div>
  );
}
