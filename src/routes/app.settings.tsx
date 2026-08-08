import { createFileRoute } from "@tanstack/react-router";
import { Bell, Link2, Palette, Shield, SlidersHorizontal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — SyncSpace Workspace" },
      { name: "description", content: "Update your profile, security, notification, appearance and workspace preferences plus connected accounts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const tabs = [
  { v: "profile", label: "Profile", icon: User },
  { v: "security", label: "Security", icon: Shield },
  { v: "notifications", label: "Notifications", icon: Bell },
  { v: "appearance", label: "Appearance", icon: Palette },
  { v: "workspace", label: "Workspace", icon: SlidersHorizontal },
  { v: "connected", label: "Connected", icon: Link2 },
];

function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and workspace preferences.</p>
      </header>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-card p-1.5">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="gap-2 rounded-xl px-3.5 py-2 text-sm data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground"
            >
              <t.icon className="size-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <Card title="Personal information" desc="This is how teammates see you across SyncSpace.">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-3xl gradient-brand text-lg font-bold text-primary-foreground">
                AM
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Upload photo</Button>
                <Button variant="ghost" size="sm">Remove</Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput id="fn" label="Full name" value="Ava Mitchell" />
              <FieldInput id="em" label="Email" value="ava@syncspace.io" />
              <FieldInput id="rl" label="Job title" value="Head of Product" />
              <FieldInput id="tz" label="Timezone" value="GMT+1 · Lisbon" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={3}
                className="rounded-2xl"
                defaultValue="Product lead at Northwind Studio. Obsessed with fast tools and calm interfaces."
              />
            </div>
            <SaveRow />
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card title="Security" desc="Protect your account and active sessions.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput id="cp" label="Current password" value="" type="password" />
              <FieldInput id="np" label="New password" value="" type="password" />
            </div>
            <Separator />
            <Toggle label="Two-factor authentication" desc="Require a 6-digit code from your authenticator app." defaultOn />
            <Toggle label="Login alerts" desc="Email me when a new device signs in." defaultOn />
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-bold">Active sessions</p>
              {[
                ["MacBook Pro · Lisbon", "Current session"],
                ["iPhone 15 · Lisbon", "2 hours ago"],
                ["Chrome · Berlin", "3 days ago"],
              ].map(([d, t]) => (
                <div key={d} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{d}</p>
                    <p className="text-xs text-muted-foreground">{t}</p>
                  </div>
                  <Button variant="ghost" size="sm">Revoke</Button>
                </div>
              ))}
            </div>
            <SaveRow />
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card title="Notifications" desc="Choose what reaches you and where.">
            <Toggle label="Mentions" desc="Someone @mentions you in a comment or doc." defaultOn />
            <Toggle label="Task assignments" desc="A task is assigned to you or reassigned." defaultOn />
            <Toggle label="Due date reminders" desc="24 hours before a task is due." defaultOn />
            <Toggle label="File uploads" desc="New files added to projects you follow." />
            <Toggle label="Weekly digest" desc="Monday summary of team productivity." defaultOn />
            <SaveRow />
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card title="Appearance" desc="Tune density and accent to match how you work.">
            <div className="space-y-2">
              <Label>Accent color</Label>
              <div className="flex flex-wrap gap-3">
                {["#6C63FF", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"].map((c, i) => (
                  <button
                    key={c}
                    className="size-10 rounded-2xl ring-offset-2 transition-transform hover:scale-110"
                    style={{ background: c, boxShadow: i === 0 ? "0 0 0 2px var(--card), 0 0 0 4px " + c : undefined }}
                    aria-label={`Accent ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Density</Label>
                <Select defaultValue="comfortable">
                  <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default view</Label>
                <Select defaultValue="board">
                  <SelectTrigger className="h-11 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="board">Kanban board</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Toggle label="Reduce motion" desc="Minimise parallax and card animations." />
            <SaveRow />
          </Card>
        </TabsContent>

        <TabsContent value="workspace">
          <Card title="Workspace preferences" desc="Applies to everyone in Northwind Studio.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput id="wn" label="Workspace name" value="Northwind Studio" />
              <FieldInput id="wu" label="Workspace URL" value="syncspace.io/northwind" />
            </div>
            <Toggle label="Guest client access" desc="Allow comment-only guests on shared projects." defaultOn />
            <Toggle label="Require 2FA for all members" desc="Enforced on next sign-in." />
            <Toggle label="Public project templates" desc="Let members publish templates to the gallery." defaultOn />
            <SaveRow />
          </Card>
        </TabsContent>

        <TabsContent value="connected">
          <Card title="Connected accounts" desc="Bring context from the tools you already use.">
            {[
              ["Slack", "Post task updates to #product", true],
              ["GitHub", "Link pull requests to tasks", true],
              ["Figma", "Embed live design previews", false],
              ["Google Drive", "Attach docs without uploading", false],
            ].map(([name, desc, on]) => (
              <div key={name as string} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">{desc}</p>
                </div>
                <Button variant={on ? "outline" : "hero"} size="sm">
                  {on ? "Disconnect" : "Connect"}
                </Button>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="surface-card space-y-6 p-6 sm:p-8">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      {children}
    </section>
  );
}

function FieldInput({ id, label, value, type = "text" }: { id: string; label: string; value: string; type?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} defaultValue={value} className="h-11 rounded-2xl" />
    </div>
  );
}

function Toggle({ label, desc, defaultOn }: { label: string; desc: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch defaultChecked={defaultOn ?? false} />
    </div>
  );
}

function SaveRow() {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost">Cancel</Button>
      <Button variant="hero">Save changes</Button>
    </div>
  );
}
