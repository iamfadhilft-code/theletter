import { createFileRoute } from "@tanstack/react-router";

/**
 * Same-origin media proxy for the private `letter-images` storage bucket.
 * Anonymous read access to this bucket is granted by its storage policy, so
 * the publishable key is sufficient — no secrets are involved here.
 */
export const Route = createFileRoute("/api/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const splat = params._splat ?? "";
        const [bucket, ...rest] = splat.split("/");
        const path = rest.join("/");

        if (!path || !/^[\w][\w\-./]*$/.test(path) || path.includes("..")) {
          return new Response("Bad request", { status: 400 });
        }
        if (bucket !== "letter-images" && bucket !== "submission-files") {
          return new Response("Bad request", { status: 400 });
        }

        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        const base = process.env["SUPABASE_URL"];
        if (!key || !base) {
          return new Response("Server misconfigured", { status: 500 });
        }

        const upstream = await fetch(
          `${base.replace(/\/+$/, "")}/storage/v1/object/${bucket}/${path}`,
          { headers: { apikey: key } },
        );

        if (!upstream.ok) {
          return new Response("Not found", { status: upstream.status === 400 ? 404 : upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
            "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
