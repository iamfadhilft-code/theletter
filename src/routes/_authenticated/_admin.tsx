import { useEffect, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Newspaper,
  UsersRound,
  Quote,
  Award,
  Inbox,
  Home,
  LogOut,
  Mail,
} from "lucide-react";
import { SITE_NAME } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/_admin")({
  component: AdminLayout,
});

const ADMIN_NAV = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard },
  { label: "Blogs", to: "/admin/blogs", icon: Newspaper },
  { label: "Profiles", to: "/admin/profiles", icon: UsersRound },
  { label: "Thoughts", to: "/admin/thoughts", icon: Quote },
  { label: "Winners", to: "/admin/winners", icon: Award },
  { label: "Submissions", to: "/admin/submissions", icon: Inbox },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<"checking" | "admin" | "denied">("checking");

  useEffect(() => {
    supabase
      .from("user_roles")
      .select("role")
      .then(({ data }) => {
        const isAdmin = (data ?? []).some((r: { role: string }) => r.role === "admin");
        setState(isAdmin ? "admin" : "denied");
      });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  if (state === "checking") {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="card-shadow max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <h1 className="font-display text-xl text-ink">Not an editor account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is only for The Letter's editors. If you should have access, ask an
            existing editor to promote your account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Back to the site
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (to: string) =>
    to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Mail className="size-5" strokeWidth={2.4} />
          </span>
          <span className="font-display text-sm uppercase text-primary">{SITE_NAME}</span>
        </Link>
        <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Admin navigation">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                isActive(item.to)
                  ? "inline-flex items-center gap-2.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  : "inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-secondary"
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-border pt-3">
          <Link
            to="/"
            className="inline-flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-foreground/70 hover:bg-secondary"
          >
            <Home className="size-4" /> View site
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-secondary"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile admin nav */}
        <div className="border-b border-border bg-card md:hidden">
          <nav className="flex gap-1 overflow-x-auto p-2" aria-label="Admin navigation">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  isActive(item.to)
                    ? "shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                    : "shrink-0 rounded-full px-4 py-2 text-xs font-medium text-foreground/70"
                }
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={signOut}
              className="ml-auto shrink-0 rounded-full px-4 py-2 text-xs text-muted-foreground"
            >
              Sign out
            </button>
          </nav>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
