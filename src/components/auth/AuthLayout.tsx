import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

const proof = ["Trusted by 12,400+ teams", "SOC 2 Type II certified", "Sub-100ms realtime sync"];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden mesh-bg lg:block">
        <div className="absolute inset-0 bg-card/40" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/">
            <Logo />
          </Link>

          <div className="space-y-8">
            <div className="w-fit animate-float rounded-3xl surface-card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Live board
              </p>
              <div className="mt-3 space-y-2.5">
                {["Realtime presence cursors", "Aurora token audit", "Ship v2.4 notes"].map(
                  (t, i) => (
                    <div
                      key={t}
                      className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5"
                      style={{
                        animation: `fade-up .6s cubic-bezier(.22,1,.36,1) ${i * 120}ms both`,
                      }}
                    >
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: ["#1A4A6E", "#5CBDB9", "#2F9E7D"][i] }}
                      />
                      <span className="text-sm font-medium">{t}</span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="ml-16 w-fit animate-float-slow rounded-3xl glass p-5 shadow-soft">
              <div className="flex -space-x-2">
                {["#1A4A6E", "#2D8A9E", "#5CBDB9", "#2F9E7D"].map((c) => (
                  <span
                    key={c}
                    className="size-9 rounded-full border-2 border-card"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm font-semibold">4 teammates editing right now</p>
            </div>
          </div>

          <ul className="space-y-2">
            {proof.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full gradient-brand" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <h1 className="mt-8 text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-sm text-muted-foreground">{footer}</div>
        </div>
      </div>
    </div>
  );
}

export function SocialButtons() {
  const items = [
    {
      label: "Google",
      d: "M12 11v2.6h4.3c-.2 1.1-1.4 3.2-4.3 3.2A4.8 4.8 0 1 1 15.2 8l1.8-1.8A7.4 7.4 0 1 0 12 19.4c4.3 0 7.1-3 7.1-7.2 0-.5 0-.8-.1-1.2H12Z",
    },
    {
      label: "GitHub",
      d: "M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.6.3-1.1.6-1.4-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.2-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.4.1 2.6.6.7 1 1.6 1 2.7 0 3.9-2.4 4.8-4.6 5 .4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10 10 0 0 0 12 2Z",
    },
    {
      label: "Apple",
      d: "M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.9-.8-3-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6 0 0-2.4-.9-2.4-3.8ZM14.2 5.6c.6-.8 1-1.9.9-3-1 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.5 2.9-1.3Z",
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((i) => (
        <button
          key={i.label}
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
        >
          <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
            <path d={i.d} />
          </svg>
          <span className="hidden sm:inline">{i.label}</span>
        </button>
      ))}
    </div>
  );
}
