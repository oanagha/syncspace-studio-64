import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, MoreHorizontal, Shield, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatedBar } from "@/components/ux/motion";
import { members as seedMembers } from "@/lib/data";

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

const palette = ["#1A4A6E", "#2D8A9E", "#5CBDB9", "#2F9E7D", "#D9A441", "#E07A5F"];

function TeamPage() {
  const [members, setMembers] = useState(seedMembers);
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("Member");
  const [pending, setPending] = useState<{ email: string; role: string }[]>([
    { email: "jade@northwind.co", role: "Member" },
    { email: "tom@helios.inc", role: "Guest" },
  ]);

  const sendInvites = () => {
    const list = emails
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (list.length === 0) {
      toast.error("Add at least one valid email address.");
      return;
    }
    setPending((prev) => [...prev, ...list.map((email) => ({ email, role }))]);
    setEmails("");
    toast.success(`${list.length} invite${list.length > 1 ? "s" : ""} sent as ${role}`);
  };

  const changeRole = (id: string, next: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: next } : m)));
    toast.success(`Role updated to ${next}`);
  };

  const removeMember = (id: string, name: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success(`${name} removed from the workspace`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Team</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} members · {pending.length} pending invites
          </p>
        </div>
        <Button
          variant="hero"
          onClick={() => document.getElementById("invite-emails")?.focus()}
        >
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
            <Input
              id="invite-emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendInvites()}
              placeholder="name@company.com, comma separated"
              className="h-11 rounded-2xl pl-9"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="h-11 w-full rounded-2xl sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Member">Member</SelectItem>
              <SelectItem value="Guest">Guest</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="hero" className="h-11" onClick={sendInvites}>
            Send invites
          </Button>
        </div>

        {pending.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Pending invites
            </p>
            {pending.map((p) => (
              <div
                key={p.email}
                className="flex items-center gap-3 rounded-2xl border border-border px-4 py-2.5"
              >
                <span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-xs font-bold text-primary">
                  {p.email[0]?.toUpperCase()}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm">{p.email}</p>
                <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground sm:inline">
                  {p.role}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Revoke invite for ${p.email}`}
                  onClick={() => {
                    setPending((prev) => prev.filter((x) => x.email !== p.email));
                    toast.success("Invite revoked");
                  }}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="surface-card overflow-hidden">
        <h2 className="px-6 pt-6 text-lg font-bold">Members</h2>
        <div className="mt-4 divide-y divide-border">
          {members.map((m, i) => (
            <div
              key={m.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]"
              style={{ animation: `fade-up .28s cubic-bezier(.22,1,.36,1) ${Math.min(i * 20, 100)}ms both` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-2xl text-xs font-bold text-primary-foreground"
                  style={{ background: m.color || palette[i % palette.length] }}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Options for ${m.name}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                  <DropdownMenuLabel>{m.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-xl"
                    onClick={() => toast(m.name, { description: `${m.email} · ${m.tasks} open tasks` })}
                  >
                    View profile
                  </DropdownMenuItem>
                  {["Owner", "Admin", "Member"]
                    .filter((r) => r !== m.role)
                    .map((r) => (
                      <DropdownMenuItem key={r} className="rounded-xl" onClick={() => changeRole(m.id, r)}>
                        Make {r}
                      </DropdownMenuItem>
                    ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="rounded-xl text-destructive focus:text-destructive"
                    onClick={() => removeMember(m.id, m.name)}
                  >
                    Remove from workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
