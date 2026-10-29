import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Public sitemap: an unauthenticated Data API read of published/active rows.
// Uses the publishable key inside a server route, never admin credentials.
function ensureApiKeyFetch() {
  const anyFetch = fetch as unknown as { __apikeyShim?: boolean };
  if (anyFetch.__apikeyShim) return;
  anyFetch.__apikeyShim = true;
  const original = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const headers = new Headers(init?.headers ?? {});
    const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
    if (url.includes("/rest/v1/") && !headers.has("apikey")) {
      headers.set("apikey", process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "");
    }
    return original(input, { ...init, headers });
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function buildSitemap(origin: string): Promise<string> {
  const staticPaths = ["", "/blogs", "/profiles", "/thought", "/winners", "/submit", "/search"];
  const urls: string[] = staticPaths.map((p) => `  <url><loc>${origin}${p}</loc></url>`);

  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (key && url) {
    ensureApiKeyFetch();
    const client = createClient(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = client as any;
    const [blogs, profiles, thoughts, winners] = await Promise.all([
      db.from("blogs").select("slug, updated_at, created_at").eq("status", "published").limit(5000),
      db.from("profiles").select("id, updated_at, created_at").eq("is_active", true).limit(5000),
      db.from("thoughts").select("id, updated_at, created_at").eq("is_published", true).limit(5000),
      db.from("winners").select("id, updated_at, created_at").eq("is_active", true).limit(5000),
    ]);

    const lastmod = (row: { updated_at?: string; created_at?: string } | undefined) =>
      escapeXml(row?.updated_at ?? row?.created_at ?? "");

    for (const b of blogs.data ?? []) {
      urls.push(
        `  <url><loc>${origin}/blogs/${escapeXml(b.slug)}</loc><lastmod>${lastmod(b)}</lastmod></url>`,
      );
    }
    for (const p of profiles.data ?? []) {
      urls.push(
        `  <url><loc>${origin}/profiles/${p.id}</loc><lastmod>${lastmod(p)}</lastmod></url>`,
      );
    }
    for (const t of thoughts.data ?? []) {
      urls.push(`  <url><loc>${origin}/thought#t-${t.id}</loc><lastmod>${lastmod(t)}</lastmod></url>`);
    }
    for (const w of winners.data ?? []) {
      urls.push(`  <url><loc>${origin}/winners#w-${w.id}</loc><lastmod>${lastmod(w)}</lastmod></url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const reqUrl = new URL(request.url);
        const forwardedHost = reqUrl.hostname === "localhost"
          ? request.headers.get("x-forwarded-host")
          : null;
        const origin = forwardedHost ? `https://${forwardedHost}` : reqUrl.origin;
        const xml = await buildSitemap(origin);
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
