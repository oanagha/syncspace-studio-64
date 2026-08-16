import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Counter, Reveal } from "@/components/ux/motion";
import { members, testimonials } from "@/lib/data";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About SyncSpace — The Team Behind the Workspace" },
      {
        name: "description",
        content:
          "Why we built SyncSpace: one realtime workspace instead of five disconnected tools. Meet the team, our principles and the numbers behind the product.",
      },
      { property: "og:title", content: "About SyncSpace" },
      {
        property: "og:description",
        content: "One realtime workspace instead of five disconnected tools — here's why.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const stats = [
  { label: "Teams onboard", value: 12400, suffix: "+" },
  { label: "Median sync latency", value: 92, suffix: "ms" },
  { label: "Uptime last year", value: 99, suffix: ".98%" },
  { label: "Countries served", value: 74, suffix: "" },
];

const principles = [
  {
    title: "Instant beats featureful",
    body: "If a feature adds latency to the shared surface, it does not ship.",
  },
  {
    title: "Context over notification",
    body: "Work should explain itself. We design for fewer pings, not more.",
  },
  {
    title: "Small teams, big leverage",
    body: "Freelancers and five-person startups get the same engine as enterprises.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-6 pb-24 pt-32 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              We build the room where <span className="gradient-text">work happens</span>
            </h1>
          </Reveal>
          <Reveal delay={90}>
            <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              SyncSpace started in 2021 after our own team lost a full day a week to context
              switching between five tools. We rebuilt collaboration around a single realtime
              surface — and never looked back.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 70}>
                <div className="surface-card p-6">
                  <p className="text-3xl font-extrabold tracking-tight">
                    <Counter to={s.value} />
                    {s.suffix}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <section className="mt-20">
            <Reveal>
              <h2 className="heading-dot text-xl font-bold">Our principles</h2>
            </Reveal>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {principles.map((p, i) => (
                <Reveal key={p.title} delay={i * 80}>
                  <article className="surface-card hover-lift h-full p-6">
                    <h3 className="text-base font-bold">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="mt-20">
            <Reveal>
              <h2 className="heading-dot text-xl font-bold">The people</h2>
            </Reveal>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.slice(0, 6).map((m, i) => (
                <Reveal key={m.id} delay={i * 60}>
                  <div className="surface-card flex items-center gap-3 p-5">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-2xl text-xs font-bold text-primary-foreground"
                      style={{ background: m.color }}
                    >
                      {m.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.role}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="mt-20">
            <Reveal>
              <h2 className="heading-dot text-xl font-bold">What people say</h2>
            </Reveal>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 80}>
                  <figure className="surface-card h-full p-6">
                    <blockquote className="text-sm text-muted-foreground">“{t.quote}”</blockquote>
                    <figcaption className="mt-4 text-sm font-bold">
                      {t.name}
                      <span className="block text-xs font-medium text-muted-foreground">
                        {t.role}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </section>

          <Reveal>
            <div className="surface-card mt-20 flex flex-col items-center gap-4 p-10 text-center">
              <h2 className="text-2xl font-extrabold">Come build with us</h2>
              <Button asChild variant="hero" size="lg">
                <Link to="/contact">
                  Get in touch <ArrowRight />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
