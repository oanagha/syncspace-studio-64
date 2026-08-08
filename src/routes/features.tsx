import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bell,
  FileStack,
  Kanban,
  Lock,
  MessageSquare,
  Search,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/ux/motion";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — SyncSpace Realtime Workspace" },
      {
        name: "description",
        content:
          "Realtime boards, threaded comments, shared files, analytics, guest access and enterprise security — everything inside one SyncSpace workspace.",
      },
      { property: "og:title", content: "Features — SyncSpace Realtime Workspace" },
      {
        property: "og:description",
        content:
          "Boards, docs, files and analytics that stay in sync in under 100ms for every teammate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturesPage,
});

const groups = [
  {
    title: "Collaborate",
    items: [
      { icon: Kanban, title: "Realtime boards", body: "Drag, drop and reorder with live cursors visible to everyone instantly." },
      { icon: MessageSquare, title: "Threaded comments", body: "Mentions, reactions and resolvable threads that keep tasks readable." },
      { icon: Users, title: "Guest client access", body: "Comment-only guests scoped to one project. No wasted seats." },
    ],
  },
  {
    title: "Organise",
    items: [
      { icon: FileStack, title: "Shared files", body: "Drop 5 GB assets onto a task with previews and versioned history." },
      { icon: Workflow, title: "Custom workflows", body: "Statuses, automations and templates tailored per project." },
      { icon: Search, title: "Instant search", body: "Find any task, file or comment across every workspace in milliseconds." },
    ],
  },
  {
    title: "Scale",
    items: [
      { icon: BarChart3, title: "Deep analytics", body: "Cycle time, throughput and workload balance computed continuously." },
      { icon: Bell, title: "Smart notifications", body: "Digest, mute and escalate — noise stays out of your focus time." },
      { icon: Lock, title: "Enterprise security", body: "SOC 2 Type II, SSO/SAML, audit logs and regional data residency." },
    ],
  },
];

function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-6 pb-24 pt-32 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-semibold backdrop-blur">
              <Zap className="size-3.5 text-primary" /> Everything in one surface
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Features built for teams that <span className="gradient-text">move fast</span>
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Every part of SyncSpace shares the same realtime engine, so boards, files and
              analytics never drift out of sync.
            </p>
          </Reveal>

          {groups.map((g, gi) => (
            <section key={g.title} className="mt-16">
              <Reveal delay={gi * 60}>
                <h2 className="heading-dot text-xl font-bold">{g.title}</h2>
              </Reveal>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((f, i) => (
                  <Reveal key={f.title} delay={i * 70}>
                    <article className="surface-card hover-lift h-full p-6">
                      <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                        <f.icon className="size-5" />
                      </span>
                      <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>
          ))}

          <Reveal>
            <div className="surface-card mt-20 flex flex-col items-center gap-4 p-10 text-center">
              <h2 className="text-2xl font-extrabold">See it running live</h2>
              <p className="max-w-lg text-sm text-muted-foreground">
                Explore the full workspace demo with real data — no signup required.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="hero" size="lg">
                  <Link to="/app">
                    Explore demo <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="glass" size="lg">
                  <Link to="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
