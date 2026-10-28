import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageManager } from "@/components/admin/ImageManager";
import { EmptyState } from "@/components/shared";
import { mediaUrl } from "@/lib/media";
import { uniqueSlug } from "@/lib/slugify";
import type { ProfileRow } from "@/lib/types";
import { Plus, Pencil, Trash2, Loader2, UsersRound, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/profiles")({
  head: () => ({ meta: [{ title: "Manage profiles — The Letter" }] }),
  component: AdminProfiles,
});

interface ProfileForm {
  id?: string;
  slug: string;
  full_name: string;
  bio: string;
  details: string;
  photo_url: string | null;
  active: boolean;
  featured: boolean;
  sort_order: number;
}

const EMPTY: ProfileForm = {
  slug: "",
  full_name: "",
  bio: "",
  details: "",
  photo_url: null,
  active: true,
  featured: false,
  sort_order: 0,
};

const profilesQuery = {
  queryKey: ["admin", "profiles"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as ProfileRow[];
  },
};

function AdminProfiles() {
  const queryClient = useQueryClient();
  const { data: profiles } = useSuspenseQuery(profilesQuery);

  const [editing, setEditing] = useState<ProfileForm | null>(null);
  const [open, setOpen] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
  };

  const save = useMutation({
    mutationFn: async (form: ProfileForm) => {
      if (!form.full_name.trim()) throw new Error("Name is required");
      const payload = {
        full_name: form.full_name.trim(),
        bio: form.bio.trim() || null,
        details: form.details.trim() || null,
        photo_url: form.photo_url,
        active: form.active,
        featured: form.featured,
        sort_order: form.sort_order,
      };
      if (form.id) {
        const { error } = await supabase.from("profiles").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const slug = await uniqueSlug("profiles", payload.full_name);
        const { error } = await supabase.from("profiles").insert({ ...payload, slug });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Profile saved");
      invalidate();
      setOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const toggleActive = useMutation({
    mutationFn: async (p: ProfileRow) => {
      const { error } = await supabase.from("profiles").update({ active: !p.active }).eq("id", p.id);
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
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile deleted");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Profiles</h1>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="size-4" /> New profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<UsersRound className="size-6" />}
            title="No profiles yet"
            description="Add the writers and voices behind The Letter."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {profiles.map((p) => {
            const photo = mediaUrl(p.photo_url);
            return (
              <li
                key={p.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-sm font-bold text-primary">
                  {photo ? <img src={photo} alt="" className="size-full object-cover" /> : initials(p.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.bio ?? "No bio"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={p.featured ? "Unfeature" : "Feature"}
                    onClick={async () => {
                      const { error } = await supabase
                        .from("profiles")
                        .update({ featured: !p.featured })
                        .eq("id", p.id);
                      if (error) toast.error("Update failed");
                      else invalidate();
                    }}
                    className={
                      p.featured
                        ? "grid size-9 place-items-center rounded-full text-primary"
                        : "grid size-9 place-items-center rounded-full text-muted-foreground hover:text-primary"
                    }
                  >
                    <Star className="size-4" fill={p.featured ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    aria-label={p.active ? "Hide" : "Show"}
                    onClick={() => toggleActive.mutate(p)}
                    className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    {p.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button
                    type="button"
                    aria-label="Edit"
                    onClick={() => {
                      setEditing({
                        id: p.id,
                        slug: p.slug,
                        full_name: p.full_name,
                        bio: p.bio ?? "",
                        details: p.details ?? "",
                        photo_url: p.photo_url,
                        active: p.active,
                        featured: p.featured,
                        sort_order: p.sort_order,
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
                      if (window.confirm(`Delete "${p.full_name}"?`)) remove.mutate(p.id);
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
        <ProfileDialog
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProfileDialog({
  form,
  saving,
  onClose,
  onSave,
}: {
  form: ProfileForm | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: ProfileForm) => void;
}) {
  const [f, setF] = useState<ProfileForm>(form ?? EMPTY);
  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setF((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-2xl rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{form ? "Edit profile" : "New profile"}</h2>
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
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full name *</span>
            <input
              value={f.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Short bio</span>
            <input
              value={f.bio}
              onChange={(e) => set("bio", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About (shown on the profile page)</span>
            <textarea
              rows={6}
              value={f.details}
              onChange={(e) => set("details", e.target.value)}
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
            Save profile
          </button>
        </div>
      </div>
    </div>
  );
}
