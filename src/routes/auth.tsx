import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Mail, Lock, Send, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — The Letter" },
      { name: "description", content: "Editor sign-in for The Letter." },
      { property: "og:title", content: "Sign in — The Letter" },
      { property: "og:description", content: "Editor sign-in for The Letter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/auth" },
      });
      if (error) throw error;
      setSentConfirmation(true);
      toast.success("Check your email to confirm the account");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:py-24">
        <div className="card-shadow rounded-3xl border border-border bg-card p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          <h1 className="font-display mt-5 text-2xl text-ink">
            {mode === "signin" ? "Editor sign in" : "Create editor account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to manage The Letter's content."
              : "New accounts need email confirmation before they can sign in."}
          </p>

          {sentConfirmation ? (
            <div className="mt-6 rounded-2xl border border-border bg-secondary p-4 text-sm text-foreground">
              Confirmation email sent to <span className="font-semibold">{email}</span>. Click the
              link in it, then come back and sign in.
            </div>
          ) : (
            <form onSubmit={mode === "signin" ? signIn : signUp} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </span>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </span>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <Send className="size-4" />
                {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setSentConfirmation(false);
            }}
            className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-primary"
          >
            {mode === "signin"
              ? "No account yet? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          This area is for The Letter's editors only.
        </p>
      </div>
    </SiteLayout>
  );
}
