import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/shared";
import type { ThoughtRow, ContentStatus } from "@/lib/types";
import { Plus, Pencil, Trash2, Loader2, Quote, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/thoughts")({
  head: () => ({ meta: [{ title: "Manage thoughts — The Letter" }] }),
  component: AdminThoughts,
});

interface ThoughtForm {
  id?: string;
  content: string;
  author_name: string;
  status: ContentStatus;
  sort_order: number;
}

const EMPTY: ThoughtForm = {
  content: "",
  author_name: "",
  status: "published",
  sort_order: 0,
};

const thoughtsQuery = {
  queryKey: ["admin", "thoughts"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("thoughts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as ThoughtRow[];
  },
};

function AdminThoughts() {
  const queryClient = useQueryClient();
  const { data: thoughts } = useSuspenseQuery(thoughtsQuery);

  const [editing, setEditing] = useState<ThoughtForm | null>(null);
  const [open, setOpen] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "thoughts"] });
    queryClient.invalidateQueries({ queryKey: ["thoughts"] });
  };

  const save = useMutation({
    mutationFn: async (form: ThoughtForm) => {
      if (!form.content.trim()) throw new Error("The thought text is required");
      const payload = {
        content: form.content.trim(),
        author_name: form.author_name.trim() || "Anonymous",
        status: form.status,
        sort_order: form.sort_order,
      };
      if (form.id) {
        const { error } = await supabase.from("thoughts").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("thoughts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Thought saved");
      invalidate();
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const togglePublish = useMutation({
    mutationFn: async (t: ThoughtRow) => {
      const next: ContentStatus = t.status === "published" ? "draft" : "published";
      const { error } = await supabase.from("thoughts").update({ status: next }).eq("id", t.id);
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
      const { error } = await supabase.from("thoughts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thought deleted");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Thoughts</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" /> New thought
        </button>
      </div>

      {thoughts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Quote className="size-6" />}
            title="No thoughts yet"
            description="Add the first one-liner."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {thoughts.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <Quote className="size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{t.content}</p>
                <p className="text-xs text-muted-foreground">— {t.author_name}</p>
              </div>
              <span
                className={
                  t.status === "published"
                    ? "shrink-0 rounded-full bg-primary-soft px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground"
                    : "shrink-0 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground"
                }
              >
                {t.status}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={t.status === "published" ? "Unpublish" : "Publish"}
                  onClick={() => togglePublish.mutate(t)}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  {t.status === "published" ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                <button
                  type="button"
                  aria-label="Edit"
                  onClick={() => {
                    setEditing({
                      id: t.id,
                      content: t.content,
                      author_name: t.author_name,
                      status: t.status,
                      sort_order: t.sort_order,
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
                    if (window.confirm("Delete this thought?")) remove.mutate(t.id);
                  }}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <ThoughtDialog
          form={editing}
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

function ThoughtDialog({
  form,
  saving,
  onClose,
  onSave,
}: {
  form: ThoughtForm | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: ThoughtForm) => void;
}) {
  const [f, setF] = useState<ThoughtForm>(form ?? EMPTY);
  const set = <K extends keyof ThoughtForm>(key: K, value: ThoughtForm[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-xl rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{form ? "Edit thought" : "New thought"}</h2>
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
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">The thought *</span>
            <textarea
              rows={4}
              value={f.content}
              onChange={(e) => set("content", e.target.value)}
              className="mt-1.5 w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-primary"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attributed to</span>
              <input
                value={f.author_name}
                onChange={(e) => set("author_name", e.target.value)}
                placeholder="Anonymous"
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</span>
              <select
                value={f.status}
                onChange={(e) => set("status", e.target.value as ContentStatus)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

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
            Save thought
          </button>
        </div>
      </div>
    </div>
  );
}
