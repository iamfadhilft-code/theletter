import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/media";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70 bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Mail className="size-5" strokeWidth={2.4} />
            </span>
            <span className="font-display text-lg uppercase text-primary">{SITE_NAME}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Words that travel further than footsteps. Stories, thoughts, and voices —
            crafted for the ones who read between the lines.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <h3 className="font-display text-xs uppercase tracking-widest text-primary">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              { label: "Home", to: "/" },
              { label: "Blogs", to: "/blogs" },
              { label: "Profiles", to: "/profiles" },
              { label: "Thought", to: "/thought" },
              { label: "Winners", to: "/winners" },
              { label: "Submit your work", to: "/submit" },
              { label: "Search", to: "/search" },
            ].map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-foreground/75 transition-colors hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="font-display text-xs uppercase tracking-widest text-primary">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-foreground/75">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-primary">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>Submissions are reviewed by our editorial team before publication.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
