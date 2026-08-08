import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/ux/motion";
import { faqs, plans } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — SyncSpace Plans for Teams & Freelancers" },
      {
        name: "description",
        content:
          "Simple SyncSpace pricing: free Starter, Pro at $14 per user and Business at $32 with SSO, audit logs and 1 TB storage. 14-day trial on every plan.",
      },
      { property: "og:title", content: "Pricing — SyncSpace Plans" },
      {
        property: "og:description",
        content: "Start free, upgrade when your team grows. No credit card for the 14-day trial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-6 pb-24 pt-32 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Pricing that scales <span className="gradient-text">with you</span>
            </h1>
          </Reveal>
          <Reveal delay={90}>
            <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Every plan includes the full realtime engine. Pay only when your team grows.
            </p>
          </Reveal>

          <Reveal delay={140}>
            <div className="mt-8 inline-flex items-center gap-1 rounded-2xl border border-border bg-card p-1">
              {(["Monthly", "Annual"] as const).map((label) => {
                const active = (label === "Annual") === annual;
                return (
                  <button
                    key={label}
                    onClick={() => setAnnual(label === "Annual")}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                    {label === "Annual" && <span className="ml-1.5 text-xs opacity-80">−20%</span>}
                  </button>
                );
              })}
            </div>
          </Reveal>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((p, i) => (
              <Reveal key={p.name} delay={i * 90}>
                <article
                  className={cn(
                    "surface-card hover-lift relative flex h-full flex-col p-7",
                    p.popular && "ring-2 ring-primary",
                  )}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                      Most popular
                    </span>
                  )}
                  <h2 className="text-lg font-bold">{p.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                  <p className="mt-6 flex items-end gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ${annual ? Math.round(p.price * 0.8) : p.price}
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">/user / mo</span>
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 pt-1">
                    <Button asChild variant={p.popular ? "hero" : "glass"} className="w-full">
                      <Link to="/signup">{p.cta}</Link>
                    </Button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <section className="mt-20">
            <Reveal>
              <h2 className="heading-dot text-xl font-bold">Frequently asked</h2>
            </Reveal>
            <Reveal delay={80}>
              <Accordion type="single" collapsible className="surface-card mt-6 px-6">
                {faqs.map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger className="text-left text-sm font-semibold">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
