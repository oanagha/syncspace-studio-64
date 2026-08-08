import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileStack,
  Kanban,
  Lock,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Counter, Parallax, Reveal } from "@/components/ux/motion";
import { faqs, members, plans, testimonials } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SyncSpace — Real-time Collaborative Workspace for Teams" },
      {
        name: "description",
        content:
          "SyncSpace unites boards, docs, files and analytics in one sub-100ms realtime workspace built for teams, freelancers and fast-moving startups.",
      },
      { property: "og:title", content: "SyncSpace — Real-time Collaborative Workspace" },
      {
        property: "og:description",
        content:
          "Boards, docs, files and analytics in one realtime workspace. Ship faster with your whole team in the same room.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Kanban, title: "Realtime boards", body: "Drag, drop and reorder with live cursors. Every teammate sees the same board in under 100ms." },
  { icon: MessageSquare, title: "Threaded comments", body: "Discuss in context with mentions, reactions and resolved threads that never clutter the task." },
  { icon: FileStack, title: "Shared files", body: "Drop 5 GB assets straight onto a task with instant previews and versioned history." },
  { icon: BarChart3, title: "Deep analytics", body: "Cycle time, throughput and workload balance, computed continuously across every project." },
  { icon: Users, title: "Guest client access", body: "Invite clients as comment-only guests scoped to a single project. No seats wasted." },
  { icon: Lock, title: "Enterprise security", body: "SOC 2 Type II, SSO/SAML, granular roles, audit logs and regional data residency." },
];

const steps = [
  { n: "01", title: "Create your workspace", body: "Import from Notion, Linear or ClickUp in one click — history and assignees intact." },
  { n: "02", title: "Invite your team", body: "Roles, permissions and guest access configured before your first standup." },
  { n: "03", title: "Ship in real time", body: "Boards, docs and files stay in sync while analytics track the momentum." },
];

function Landing() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-24 pt-28 sm:pt-36">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(45% 60% at 25% 40%, color-mix(in oklab, var(--primary) 34%, transparent), transparent), radial-gradient(40% 55% at 75% 30%, color-mix(in oklab, var(--accent) 32%, transparent), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-6xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-semibold backdrop-blur">
                <Sparkles className="size-3.5 text-primary" />
                SyncSpace 2.4 — realtime presence is here
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mx-auto mt-7 max-w-4xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                The workspace where your team{" "}
                <span className="gradient-text">thinks together</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
                Boards, documents, files and analytics in one sub-100ms realtime surface.
                Built for teams, freelancers and startups that hate context switching.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild variant="hero" size="lg">
                  <Link to="/signup">
                    Start free trial <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="glass" size="lg">
                  <Link to="/app">Explore live demo</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                14-day trial · no credit card · cancel anytime
              </p>
            </Reveal>
          </div>

          {/* Product mockup */}
          <Reveal delay={320}>
            <Parallax speed={0.06}>
              <div className="relative mx-auto mt-16 max-w-5xl">
                <div className="glass overflow-hidden rounded-[28px] p-2 shadow-xl">
                  <div className="rounded-[22px] bg-card">
                    <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                      <span className="size-2.5 rounded-full bg-destructive/70" />
                      <span className="size-2.5 rounded-full bg-warning/70" />
                      <span className="size-2.5 rounded-full bg-success/70" />
                      <span className="ml-3 text-xs font-medium text-muted-foreground">
                        Northwind Studio · Aurora Design System
                      </span>
                    </div>
                    <div className="grid gap-4 p-4 sm:grid-cols-4">
                      {["Todo", "In Progress", "Review", "Done"].map((col, ci) => (
                        <div key={col} className="rounded-2xl bg-muted/50 p-3">
                          <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                            {col}
                          </p>
                          <div className="space-y-2.5">
                            {Array.from({ length: 3 - (ci % 2) }).map((_, i) => (
                              <div
                                key={i}
                                className="rounded-xl bg-card p-3 shadow-sm"
                                style={{
                                  animation: `fade-up .6s cubic-bezier(.22,1,.36,1) ${400 + ci * 120 + i * 90}ms both`,
                                }}
                              >
                                <div className="h-2 w-3/4 rounded-full bg-muted" />
                                <div className="mt-2 h-2 w-1/2 rounded-full bg-muted" />
                                <div className="mt-3 flex items-center gap-1.5">
                                  <span
                                    className="size-5 rounded-full"
                                    style={{ background: members[(ci + i) % members.length]!.color }}
                                  />
                                  <span
                                    className="h-1.5 w-10 rounded-full"
                                    style={{
                                      background: `color-mix(in oklab, ${members[(ci + i) % members.length]!.color} 45%, transparent)`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass absolute -left-4 bottom-10 hidden animate-float items-center gap-2 rounded-2xl px-4 py-3 sm:flex">
                  <span className="grid size-8 place-items-center rounded-xl gradient-brand text-[11px] font-bold text-primary-foreground">
                    PR
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-bold">Priya is editing</p>
                    <p className="text-[10px] text-muted-foreground">Accessibility sweep</p>
                  </div>
                </div>
                <div className="glass absolute -right-4 top-16 hidden animate-float items-center gap-2 rounded-2xl px-4 py-3 [animation-delay:1.2s] sm:flex">
                  <Zap className="size-4 text-accent" />
                  <p className="text-xs font-bold">Synced in 42ms</p>
                </div>
              </div>
            </Parallax>
          </Reveal>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { to: 24000, suffix: "+", label: "Teams onboard" },
              { to: 98, suffix: "ms", label: "Median sync" },
              { to: 34, suffix: "%", label: "Faster delivery" },
              { to: 99.99, suffix: "%", label: "Uptime", decimals: 2 },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="text-center">
                  <p className="text-3xl font-extrabold sm:text-4xl">
                    <Counter to={s.to} suffix={s.suffix} decimals={s.decimals ?? 0} />
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Features</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Everything your team opens in a day, in one tab
                </h2>
                <p className="mt-4 text-muted-foreground">
                  No more jumping between six tools to answer one question.
                </p>
              </div>
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={i * 70}>
                  <article className="surface-card hover-lift h-full p-6">
                    <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                      <f.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
                Live with your team in an afternoon
              </h2>
            </Reveal>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 110}>
                  <div className="relative surface-card h-full p-7">
                    <span className="gradient-text text-4xl font-extrabold">{s.n}</span>
                    <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
                Loved by teams that ship weekly
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 90}>
                  <figure className="surface-card hover-lift flex h-full flex-col p-7">
                    <blockquote className="flex-1 text-sm leading-relaxed">“{t.quote}”</blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <span
                        className="grid size-10 place-items-center rounded-2xl text-xs font-bold text-primary-foreground"
                        style={{ background: members[i]!.color }}
                      >
                        {members[i]!.initials}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="text-center">
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Simple pricing that scales with you
                </h2>
                <div className="mt-7 inline-flex items-center gap-1 rounded-2xl border border-border p-1">
                  {[
                    ["Monthly", false],
                    ["Annual · save 20%", true],
                  ].map(([label, val]) => (
                    <button
                      key={label as string}
                      onClick={() => setAnnual(val as boolean)}
                      className={cn(
                        "rounded-xl px-4 py-2 text-xs font-semibold transition-colors",
                        annual === val
                          ? "gradient-brand text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </Reveal>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {plans.map((p, i) => (
                <Reveal key={p.name} delay={i * 90}>
                  <article
                    className={cn(
                      "surface-card hover-lift relative flex h-full flex-col p-8",
                      p.popular && "ring-2 ring-primary",
                    )}
                  >
                    {p.popular && (
                      <span className="absolute -top-3 left-8 rounded-full gradient-brand px-3 py-1 text-[11px] font-bold text-primary-foreground">
                        Most popular
                      </span>
                    )}
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                    <p className="mt-6 text-4xl font-extrabold">
                      ${annual ? Math.round(p.price * 0.8) : p.price}
                      <span className="text-sm font-medium text-muted-foreground">/user/mo</span>
                    </p>
                    <ul className="mt-6 flex-1 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-success" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant={p.popular ? "hero" : "outline"} className="mt-8">
                      <Link to="/signup">{p.cta}</Link>
                    </Button>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
                Questions, answered
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <Accordion type="single" collapsible className="mt-10 space-y-3">
                {faqs.map((f, i) => (
                  <AccordionItem
                    key={f.q}
                    value={`i${i}`}
                    className="surface-card border-none px-6"
                  >
                    <AccordionTrigger className="text-left text-sm font-bold hover:no-underline">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-28">
          <Reveal>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] gradient-brand px-8 py-16 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
                Your team's next sprint starts here
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-primary-foreground/80">
                Join 24,000+ teams collaborating in real time. Free for 14 days, no card required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild variant="glass" size="lg">
                  <Link to="/signup">
                    Create your workspace <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/signin">Sign in</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
