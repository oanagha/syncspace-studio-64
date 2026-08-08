import { createFileRoute } from "@tanstack/react-router";
import { Mail, MoreHorizontal, Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatedBar } from "@/components/ux/motion";
import { members } from "@/lib/data";

export const Route = createFileRoute("/app/team")({
  head: () => ({
    meta: [
      { title: "Team & Permissions — SyncSpace Workspace" },
      { name: "description", content: "Invite teammates, manage Owner/Admin/Member roles and review a granular permissions matrix." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeamPage,
});

const permissions = [
  ["Create & delete projects", true, true, false],
  ["Invite members", true, true, false],
  ["Manage billing", true, false, false],
  ["Edit tasks & boards", true, true, true],
  ["Upload files", true, true, true],
  ["View analytics", true, true, true],
  ["Manage SSO & audit logs", true, false, false],
] as const;

function TeamPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Team</h1>
          <p className="text-sm text-muted-foreground">{members.length} members · 2 pending invites</p>
        </div>
        <Button variant="hero">
          <UserPlus /> Invite members
        </Button>
      </header>

      <section className="surface-card p-6">
        <h2 className="text-lg font-bold">Invite teammates</h2>
        <p className="text-sm text-muted-foreground">
          They'll get access to Northwind Studio and every project you share.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="name@company.com, comma separated" className="h-11 rounded-2xl pl-9" />
          </div>
          <Select defaultValue="Member">
            <SelectTrigger className="h-11 w-full rounded-2xl sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Member">Member</SelectItem>
              <SelectItem value="Guest">Guest</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="hero" className="h-11">
            Send invites
          </Button>
        </div>
      </section>

      <section className="surface-card overflow-hidden">
        <h2 className="px-6 pt-6 text-lg font-bold">Members</h2>
        <div className="mt-4 divide-y divide-border">
          {members.map((m, i) => (
            <div
              key={m.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]"
              style={{ animation: `fade-up .5s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-2xl text-xs font-bold text-primary-foreground"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                  <Shield className="size-3" /> {m.role}
                </span>
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="text-xs text-muted-foreground">{m.tasks} tasks · {m.activity}% active</p>
                <div className="mt-1.5">
                  <AnimatedBar value={m.activity} color={m.color} />
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Member options">
                <MoreHorizontal />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card overflow-x-auto p-6">
        <h2 className="text-lg font-bold">Permissions</h2>
        <table className="mt-4 w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 font-bold">Capability</th>
              <th className="pb-3 font-bold">Owner</th>
              <th className="pb-3 font-bold">Admin</th>
              <th className="pb-3 font-bold">Member</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {permissions.map(([cap, o, a, mm]) => (
              <tr key={cap as string}>
                <td className="py-3 pr-4 font-medium">{cap}</td>
                {[o, a, mm].map((v, idx) => (
                  <td key={idx} className="py-3">
                    <span
                      className={
                        v
                          ? "inline-grid size-6 place-items-center rounded-full bg-success/15 text-xs font-bold text-success"
                          : "inline-grid size-6 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
                      }
                    >
                      {v ? "✓" : "–"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
