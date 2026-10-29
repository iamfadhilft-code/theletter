import { createFileRoute } from "@tanstack/react-router";

// Public sitemap: an unauthenticated Data API read of published/active rows,
// using the publishable key (sent as `apikey`, never admin credentials).

type Row = { [k: string]: unknown };

async function readRows(table: string, filter: string, columns: string): Promise<Row[]> {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const base = process.env["SUPABASE_URL"];
  if (!key || !base) return [];
  const res = await fetch(
    `${base.replace(/\/+$/, "")}/rest/v1/${table}?select=${columns}&${filter}&limit=5000`,
    { headers: { apikey: key } },
  );
  if (!res.ok) return [];
  return (await res.json()) as Row[];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function str(row: Row, key: string): string {
  return typeof row[key] === "string" ? (row[key] as string) : "";
}

function lastmod(row: Row): string {
  return escapeXml(str(row, "updated_at") || str(row, "created_at"));
}

async function buildSitemap(origin: string): Promise<string> {
  const staticPaths = ["", "/blogs", "/profiles", "/thought", "/winners", "/submit", "/search"];
  const urls: string[] = staticPaths.map((p) => `  <url><loc>${origin}${p}</loc></url>`);

  const [blogs, profiles, thoughts, winners] = await Promise.all([
    readRows("blogs", "status=eq.published", "slug,updated_at,created_at"),
    readRows("profiles", "is_active=eq.true", "id,updated_at,created_at"),
    readRows("thoughts", "is_published=eq.true", "id,updated_at,created_at"),
    readRows("winners", "is_active=eq.true", "id,updated_at,created_at"),
  ]);

  for (const b of blogs) {
    urls.push(`  <url><loc>${origin}/blogs/${escapeXml(str(b, "slug"))}</loc><lastmod>${lastmod(b)}</lastmod></url>`);
  }
  for (const p of profiles) {
    urls.push(`  <url><loc>${origin}/profiles/${str(p, "id")}</loc><lastmod>${lastmod(p)}</lastmod></url>`);
  }
  for (const t of thoughts) {
    urls.push(`  <url><loc>${origin}/thought#t-${str(t, "id")}</loc><lastmod>${lastmod(t)}</lastmod></url>`);
  }
  for (const w of winners) {
    urls.push(`  <url><loc>${origin}/winners#w-${str(w, "id")}</loc><lastmod>${lastmod(w)}</lastmod></url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const reqUrl = new URL(request.url);
        const forwardedHost =
          reqUrl.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
        const origin = forwardedHost ? `https://${forwardedHost}` : reqUrl.origin;
        const xml = await buildSitemap(origin);
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
