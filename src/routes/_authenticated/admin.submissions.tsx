import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/shared";
import { mediaUrl } from "@/lib/media";
import { uniqueSlug, formatDate } from "@/lib/slugify";
import type { SubmissionRow } from "@/lib/types";
import { Inbox, Check, X, Trash2, Loader2, Eye, MailOpen, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  head: () => ({ meta: [{ title: "Review submissions — The Letter" }] }),
  component: AdminSubmissions,
});

const submissionsQuery = {
  queryKey: ["admin", "submissions"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as SubmissionRow[];
  },
};

function statusClass(status: string) {
  if (status === "pending")
    return "shrink-0 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground";
  if (status === "approved")
    return "shrink-0 rounded-full bg-primary-soft px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground";
  return "shrink-0 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground";
}

function AdminSubmissions() {
  const queryClient = useQueryClient();
  const { data: submissions } = useSuspenseQuery(submissionsQuery);
  const [viewing, setViewing] = useState<SubmissionRow | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
  };

  // Approving turns the submission into a draft blog the editor can publish.
  const approve = useMutation({
    mutationFn: async (s: SubmissionRow) => {
      const slug = await uniqueSlug("blogs", s.title);
      const { error } = await supabase.from("blogs").insert({
        title: s.title,
        short_description: s.description,
        content: s.content,
        cover_image_url: null,
        image_urls: s.image_urls ?? [],
        author_id: null,
        category: null,
        status: "draft",
        featured: false,
        sort_order: 0,
        published_at: null,
        slug,
      });
      if (error) throw error;
      const { error: subError } = await supabase
        .from("submissions")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", s.id);
      if (subError) throw subError;
    },
    onSuccess: () => {
      toast.success("Approved — a draft blog was created. Publish it from Manage blogs.");
      invalidate();
      setViewing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Approval failed"),
  });

  const reject = useMutation({
    mutationFn: async (s: SubmissionRow) => {
      const { error } = await supabase
        .from("submissions")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submission rejected");
      invalidate();
      setViewing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("submissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submission deleted");
      invalidate();
      setViewing(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const pending = submissions.filter((s) => s.status === "pending");
  const reviewed = submissions.filter((s) => s.status !== "pending");

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Submissions</h1>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {pending.length} pending
        </span>
      </div>

      {submissions.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Inbox className="size-6" />}
            title="No submissions yet"
            description="Reader submissions sent through the site will appear here."
          />
        </div>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Pending</h2>
            {pending.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nothing waiting for review.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {pending.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{s.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.author_name} · {formatDate(s.created_at)}
                      </p>
                    </div>
                    <span className={statusClass(s.status)}>{s.status}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="Read submission"
                        onClick={() => setViewing(s)}
                        className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Approve"
                        disabled={approve.isPending}
                        onClick={() => approve.mutate(s)}
                        className="grid size-9 place-items-center rounded-full text-primary hover:bg-primary-soft disabled:opacity-50"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Reject"
                        disabled={reject.isPending}
                        onClick={() => reject.mutate(s)}
                        className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-destructive disabled:opacity-50"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {reviewed.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Reviewed</h2>
              <ul className="mt-3 space-y-2">
                {reviewed.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{s.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.author_name} · {s.reviewed_at ? formatDate(s.reviewed_at) : formatDate(s.created_at)}
                      </p>
                    </div>
                    <span className={statusClass(s.status)}>{s.status}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="Read submission"
                        onClick={() => setViewing(s)}
                        className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete"
                        onClick={() => {
                          if (window.confirm(`Delete "${s.title}"?`)) remove.mutate(s.id);
                        }}
                        className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {viewing && (
        <SubmissionDialog
          submission={viewing}
          busy={approve.isPending || reject.isPending || remove.isPending}
          onClose={() => setViewing(null)}
          onApprove={() => approve.mutate(viewing)}
          onReject={() => reject.mutate(viewing)}
        />
      )}
    </div>
  );
}

function SubmissionDialog({
  submission,
  busy,
  onClose,
  onApprove,
  onReject,
}: {
  submission: SubmissionRow;
  busy: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-2xl rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{submission.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <MailOpen className="size-3.5" />
          {submission.author_name} · {submission.author_email}
        </p>
        {submission.description && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{submission.description}</p>
        )}

        <div className="prose-letter mt-6 rounded-2xl bg-secondary/60 p-4 text-sm leading-relaxed text-foreground/90">
          {submission.content.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {(submission.image_urls ?? []).filter(Boolean).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {(submission.image_urls ?? [])
              .filter(Boolean)
              .map((p, i) => {
                const url = mediaUrl(p);
                return url ? (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="h-20 w-28 rounded-xl border border-border object-cover"
                  />
                ) : null;
              })}
          </div>
        )}

        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="size-3.5" />
          Approving creates a draft blog you can publish from Manage blogs.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            Reject
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Check className="size-4" />
            Approve as draft
          </button>
        </div>
      </div>
    </div>
  );
}
