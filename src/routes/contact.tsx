import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Reveal } from "@/components/ux/motion";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact SyncSpace — Sales, Support & Partnerships" },
      {
        name: "description",
        content:
          "Talk to the SyncSpace team about migrations, enterprise plans or support. We reply to every message within one business day.",
      },
      { property: "og:title", content: "Contact SyncSpace" },
      {
        property: "og:description",
        content: "Questions about plans, migrations or security? We reply within one business day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="px-6 pb-24 pt-32 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Let's talk about <span className="gradient-text">your workflow</span>
            </h1>
          </Reveal>
          <Reveal delay={90}>
            <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Migrations, enterprise security reviews or a plain old question — we answer all of it.
            </p>
          </Reveal>

          <div className="mt-12 max-w-2xl">
            <Reveal>
              <form
                className="surface-card p-7"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" required placeholder="Ava Mitchell" className="h-11 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="ava@company.com"
                      className="h-11 rounded-2xl"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Migrating 40 people from Notion" className="h-11 rounded-2xl" />
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" required rows={6} placeholder="Tell us what you need…" className="rounded-2xl" />
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button type="submit" variant="hero">
                    <Send /> Send message
                  </Button>
                  {sent && (
                    <span className="animate-pop text-sm font-semibold text-primary">
                      Thanks — we'll get back to you shortly.
                    </span>
                  )}
                </div>
              </form>
            </Reveal>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
