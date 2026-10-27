import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Send, CheckCircle2, ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/submit")({
  head: () => ({
    meta: [
      { title: "Submit your work — The Letter" },
      {
        name: "description",
        content: "Send your writing to The Letter. If it moves us, it moves the world.",
      },
      { property: "og:title", content: "Submit your work — The Letter" },
      {
        property: "og:description",
        content: "Send your writing to The Letter. If it moves us, it moves the world.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubmitPage,
});

const MAX_IMAGES = 4;

function SubmitPage() {
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const room = MAX_IMAGES - files.length;
    if (room <= 0) {
      toast.error(`Up to ${MAX_IMAGES} images`);
      return;
    }
    const picked = Array.from(list).slice(0, room);
    for (const f of picked) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} is over 10MB`);
        return;
      }
    }
    setFiles((prev) => [...prev, ...picked]);
  };

  const uploadImages = async (): Promise<string[] | null> => {
    const urls: string[] = [];
    for (const [i, file] of files.entries()) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `submissions/${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("submission-files").upload(path, file);
      if (error) {
        toast.error(`Image upload failed: ${error.message}`);
        return null;
      }
      urls.push(path);
    }
    return urls;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const imageUrls = await uploadImages();
      if (imageUrls === null) return;
      const { error } = await supabase.from("submissions").insert({
        title,
        description: description || null,
        content,
        author_name: authorName,
        author_email: authorEmail,
        image_urls: imageUrls.length ? imageUrls : null,
        status: "pending",
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed — please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        {done ? (
          <div className="card-shadow flex flex-col items-center rounded-3xl border border-border bg-card px-6 py-16 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-primary-soft">
              <CheckCircle2 className="size-8 text-primary" />
            </div>
            <h1 className="font-display mt-5 text-2xl text-ink">Letter received</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Thank you — our editors will read it soon. If it's selected, it will appear on The
              Letter.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Your turn</p>
            <h1 className="font-display mt-1.5 text-3xl text-ink sm:text-4xl">Submit your work</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Send your letter, essay or story. Every submission is read by an editor before
              publishing.
            </p>

            <form onSubmit={onSubmit} className="card-shadow mt-8 space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title *</span>
                <input
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What should we call this?"
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your name *</span>
                  <input
                    required
                    maxLength={120}
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your email *</span>
                  <input
                    required
                    type="email"
                    maxLength={200}
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Short description</span>
                <input
                  maxLength={300}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A one-line summary"
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your letter *</span>
                <textarea
                  required
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write here…"
                  className="mt-1.5 w-full resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-primary"
                />
              </label>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Images (optional, up to {MAX_IMAGES})
                </span>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {files.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs text-foreground"
                    >
                      {f.name.slice(0, 24)}
                      <button
                        type="button"
                        aria-label={`Remove ${f.name}`}
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                  {files.length < MAX_IMAGES && (
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary">
                      <ImagePlus className="size-4" />
                      Add images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          addFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {busy ? "Sending…" : "Send to the editors"}
              </button>
            </form>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
