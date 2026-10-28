import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, UsersRound, Quote, Award, Inbox } from "lucide-react";
import { formatDate } from "@/lib/slugify";

export const Route = createFileRoute("/_authenticated/_admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin overview — The Letter" }] }),
  component: AdminDashboard,
});

// Table names come from callers, so go through a loosely-typed client here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function count(table: string, filters?: Record<string, unknown>) {
  const client = supabase as any;
  let query = client.from(table).select("id", { count: "exact", head: true });
  if (filters) for (const [k, v] of Object.entries(filters)) query = query.eq(k, v);
  const { count: c } = await query;
  return c ?? 0;
}

const statsQuery = {
  queryKey: ["admin", "stats"],
  queryFn: async () => {
    const [
      blogsTotal,
      blogsPublished,
      profilesTotal,
      thoughtsTotal,
      winnersTotal,
      pendingSubmissions,
      submissionsTotal,
    ] = await Promise.all([
      count("blogs"),
      count("blogs", { status: "published" }),
      count("profiles"),
      count("thoughts"),
      count("winners"),
      count("submissions", { status: "pending" }),
      count("submissions"),
    ]);
    const { data: recent } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    return {
      blogsTotal,
      blogsPublished,
      profilesTotal,
      thoughtsTotal,
      winnersTotal,
      pendingSubmissions,
      submissionsTotal,
      recent: recent ?? [],
    };
  },
};

function AdminDashboard() {
  const { data } = useSuspenseQuery(statsQuery);

  const cards = [
    { label: "Blogs", value: data.blogsTotal, sub: `${data.blogsPublished} published`, icon: Newspaper, to: "/admin/blogs" },
    { label: "Profiles", value: data.profilesTotal, sub: "writers & voices", icon: UsersRound, to: "/admin/profiles" },
    { label: "Thoughts", value: data.thoughtsTotal, sub: "one-liners", icon: Quote, to: "/admin/thoughts" },
    { label: "Winners", value: data.winnersTotal, sub: "awarded", icon: Award, to: "/admin/winners" },
    { label: "Pending submissions", value: data.pendingSubmissions, sub: `${data.submissionsTotal} total`, icon: Inbox, to: "/admin/submissions" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink sm:text-3xl">Overview</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="card-shadow rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-primary-soft">
                <c.icon className="size-5 text-primary" />
              </div>
              <span className="font-display text-3xl text-ink">{c.value}</span>
            </div>
            <p className="mt-4 text-sm font-semibold text-ink">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Latest submissions</h2>
          <Link to="/admin/submissions" className="text-sm font-semibold text-primary hover:underline">
            Review all
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No submissions yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.recent.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.author_name} · {formatDate(s.created_at)}
                  </p>
                </div>
                <span
                  className={
                    s.status === "pending"
                      ? "shrink-0 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground"
                      : s.status === "approved"
                        ? "shrink-0 rounded-full bg-primary-soft px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground"
                        : "shrink-0 rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground"
                  }
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

