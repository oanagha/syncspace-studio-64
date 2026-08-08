import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

const groups = [
  { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap", "Integrations"] },
  { title: "Company", links: ["About", "Careers", "Blog", "Press kit", "Contact"] },
  { title: "Resources", links: ["Docs", "API reference", "Community", "Templates", "Status"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "DPA", "Cookies"] },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The real-time workspace where teams, freelancers and startups plan, build and ship
              together — without the tab chaos.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border p-1.5">
              <input
                placeholder="you@company.com"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button className="rounded-xl gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground">
                Subscribe
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {groups.map((g) => (
              <div key={g.title}>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {g.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {g.links.map((l) => (
                    <li key={l}>
                      <span className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-primary">
                        {l}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SyncSpace Labs, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/pricing" className="hover:text-primary">
              Pricing
            </Link>
            <Link to="/contact" className="hover:text-primary">
              Contact
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
