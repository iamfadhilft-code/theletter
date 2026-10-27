import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, Loader2, X } from "lucide-react";
import { mediaUrl } from "@/lib/media";
import { toast } from "sonner";

/**
 * Manages a list of stored image paths in the `letter-images` bucket.
 * `single` renders one slot (cover image); otherwise a multi-slot gallery.
 */
export function ImageManager({
  paths,
  onChange,
  multiple = false,
  label,
}: {
  paths: string[];
  onChange: (paths: string[]) => void;
  multiple?: boolean;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!multiple) onChange([]);
    setUploading(true);
    try {
      const next = [...paths];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is over 10MB`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `admin/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("letter-images").upload(path, file);
        if (error) {
          toast.error(`Upload failed: ${error.message}`);
          continue;
        }
        next.push(path);
      }
      onChange(multiple ? next : next.slice(-1));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (path: string) => onChange(paths.filter((p) => p !== path));

  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {paths.map((p) => {
          const url = mediaUrl(p);
          return (
            <span key={p} className="relative overflow-hidden rounded-xl border border-border">
              {url && <img src={url} alt="" className="h-20 w-28 object-cover" />}
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => remove(p)}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 text-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </span>
          );
        })}
        {(multiple || paths.length === 0) && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {uploading ? "Uploading…" : "Upload"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple={multiple}
              className="hidden"
              onChange={(e) => pick(e.target.files)}
            />
          </label>
        )}
      </div>
    </div>
  );
}
