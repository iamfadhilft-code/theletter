import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Mail, Send, Menu, X, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_NAME } from "@/lib/media";

const NAV = [
  { label: "Home", to: "/" },
  { label: "Blogs", to: "/blogs" },
  { label: "Profiles", to: "/profiles" },
  { label: "Thought", to: "/thought" },
  { label: "Winners", to: "/winners" },
] as const;

export function SiteHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const submitSearchShortcut = () => {
    // "admin" typed into a search field only reaches the login page;
    // authentication is always required beyond that.
    setOpen(false);
    navigate({ to: "/auth" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Mail className="size-5" strokeWidth={2.4} />
          </span>
          <span className="font-display truncate text-lg uppercase tracking-tight text-primary sm:text-xl">
            {SITE_NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                isActive(item.to)
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors"
                  : "rounded-full px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/submit"
            className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] sm:inline-flex"
          >
            <Send className="size-4" />
            Submit
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="grid size-10 place-items-center rounded-full border border-border bg-card text-foreground md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={
                  isActive(item.to)
                    ? "rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                    : "rounded-xl px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-secondary"
                }
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/submit"
              onClick={() => setOpen(false)}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Send className="size-4" /> Submit your work
            </Link>
            <button
              type="button"
              onClick={submitSearchShortcut}
              className="rounded-xl px-4 py-2.5 text-left text-xs text-muted-foreground"
            >
              Admin sign in
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
