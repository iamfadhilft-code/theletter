import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageManager } from "@/components/admin/ImageManager";
import { EmptyState } from "@/components/shared";
import { mediaUrl } from "@/lib/media";
import type { WinnerRow } from "@/lib/types";
import { Plus, Pencil, Trash2, Loader2, Award, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/winners")({
  head: () => ({ meta: [{ title: "Manage winners — The Letter" }] }),
  component: AdminWinners,
});

interface WinnerForm {
  id?: string;
  full_name: string;
  award_title: string;
  category: string;
  description: string;
  award_date: string;
  photo_url: string | null;
  featured: boolean;
  active: boolean;
  sort_order: number;
}

const EMPTY: WinnerForm = {
  full_name: "",
  award_title: "",
  category: "",
  description: "",
  award_date: "",
  photo_url: null,
  featured: false,
  active: true,
  sort_order: 0,
};

const winnersQuery = {
  queryKey: ["admin", "winners"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("winners")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as WinnerRow[];
  },
};

function AdminWinners() {
  const queryClient = useQueryClient();
  const { data: winners } = useSuspenseQuery(winnersQuery);

  const [editing, setEditing] = useState<WinnerForm | null>(null);
  const [open, setOpen] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "winners"] });
    queryClient.invalidateQueries({ queryKey: ["winners"] });
  };

  const save = useMutation({
    mutationFn: async (form: WinnerForm) => {
      if (!form.full_name.trim()) throw new Error("Name is required");
      if (!form.award_title.trim()) throw new Error("Award title is required");
      const payload = {
        full_name: form.full_name.trim(),
        award_title: form.award_title.trim(),
        category: form.category.trim() || null,
        description: form.description.trim() || null,
        award_date: form.award_date || null,
        photo_url: form.photo_url,
        featured: form.featured,
        active: form.active,
        sort_order: form.sort_order,
      };
      if (form.id) {
        const { error } = await supabase.from("winners").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("winners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Winner saved");
      invalidate();
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const toggleActive = useMutation({
    mutationFn: async (w: WinnerRow) => {
      const { error } = await supabase.from("winners").update({ active: !w.active }).eq("id", w.id);
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
      const { error } = await supabase.from("winners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Winner deleted");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Winners</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" /> New winner
        </button>
      </div>

      {winners.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Award className="size-6" />}
            title="No winners yet"
            description="Celebrate the first award."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {winners.map((w) => {
            const photo = mediaUrl(w.photo_url);
            return (
              <li
                key={w.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft">
                  {photo ? <img src={photo} alt="" className="size-full object-cover" /> : <Award className="size-5 text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {w.full_name} · {w.award_title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{w.category ?? "—"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={w.featured ? "Unfeature" : "Feature"}
                    onClick={async () => {
                      const { error } = await supabase
                        .from("winners")
                        .update({ featured: !w.featured })
                        .eq("id", w.id);
                      if (error) toast.error("Update failed");
                      else invalidate();
                    }}
                    className={
                      w.featured
                        ? "grid size-9 place-items-center rounded-full text-primary"
                        : "grid size-9 place-items-center rounded-full text-muted-foreground hover:text-primary"
                    }
                  >
                    <Star className="size-4" fill={w.featured ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    aria-label={w.active ? "Hide" : "Show"}
                    onClick={() => toggleActive.mutate(w)}
                    className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    {w.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => {
                      setEditing({
                        id: w.id,
                        full_name: w.full_name,
                        award_title: w.award_title,
                        category: w.category ?? "",
                        description: w.description ?? "",
                        award_date: w.award_date ?? "",
                        photo_url: w.photo_url,
                        featured: w.featured,
                        active: w.active,
                        sort_order: w.sort_order,
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
                      if (window.confirm(`Delete "${w.full_name}"?`)) remove.mutate(w.id);
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
        <WinnerDialog
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

function WinnerDialog({
  form,
  saving,
  onClose,
  onSave,
}: {
  form: WinnerForm | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: WinnerForm) => void;
}) {
  const [f, setF] = useState<WinnerForm>(form ?? EMPTY);
  const set = <K extends keyof WinnerForm>(key: K, value: WinnerForm[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-2xl rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{form ? "Edit winner" : "New winner"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full name *</span>
              <input
                value={f.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Award title *</span>
              <input
                value={f.award_title}
                onChange={(e) => set("award_title", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

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
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Award date</span>
              <input
                type="date"
                value={f.award_date}
                onChange={(e) => set("award_date", e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</span>
            <textarea
              rows={4}
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
              className="mt-1.5 w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-primary"
            />
          </label>

          <ImageManager
            label="Photo"
            paths={f.photo_url ? [f.photo_url] : []}
            onChange={(paths) => set("photo_url", paths[0] ?? null)}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display order</span>
              <input
                type="number"
                value={f.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
                className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="mt-1 flex items-center gap-3 self-end pb-1">
              <input
                type="checkbox"
                checked={f.active}
                onChange={(e) => set("active", e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              <span className="text-sm font-semibold text-ink">Visible on site</span>
            </label>
          </div>
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
            Save winner
          </button>
        </div>
      </div>
    </div>
  );
}
