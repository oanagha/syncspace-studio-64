import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center gap-4 rounded-3xl px-4 py-3 transition-all duration-200 sm:px-6",
          scrolled ? "glass shadow-soft" : "border border-transparent",
        )}
      >
        <Link to="/" preload="render" className="shrink-0">
          <Logo />
        </Link>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              preload="render"
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              activeProps={{ className: "text-primary bg-primary-soft" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/signin" preload="render">
              Sign in
            </Link>
          </Button>
          <Button asChild variant="hero">
            <Link to="/signup" preload="render">
              Get Started
            </Link>
          </Button>
          <Button
            variant="glass"
            size="icon"
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl animate-pop rounded-3xl glass p-3 shadow-soft md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              preload="render"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-primary-soft hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/signin"
            preload="render"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-primary-soft hover:text-primary"
          >
            Sign in
          </Link>
        </div>
      )}
    </header>
  );
}
