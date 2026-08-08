import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronsUpDown,
  FolderKanban,
  Files,
  Gauge,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  SquareKanban,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { members, notifications, projects, workspaces } from "@/lib/data";
import { cn } from "@/lib/utils";

const nav: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/board", label: "Kanban board", icon: SquareKanban },
  { to: "/app/team", label: "Team", icon: Users },
  { to: "/app/files", label: "Files", icon: Files },
  { to: "/app/analytics", label: "Analytics", icon: Gauge },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [ws, setWs] = useState(workspaces[0]!);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unread = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] lg:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-4">
          <Link to="/">{collapsed ? <Logo mark /> : <Logo />}</Link>
        </div>

        <div className="px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border border-sidebar-border p-2.5 text-left transition-colors hover:bg-sidebar-accent",
                  collapsed && "justify-center",
                )}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl gradient-brand text-xs font-bold text-primary-foreground">
                  {ws.initials}
                </span>
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{ws.name}</span>
                      <span className="block text-xs text-muted-foreground">{ws.plan} plan</span>
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-2xl">
              <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((w) => (
                <DropdownMenuItem key={w.id} onClick={() => setWs(w)} className="gap-3 rounded-xl">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-[10px] font-bold text-primary">
                    {w.initials}
                  </span>
                  <span className="flex-1">{w.name}</span>
                  {w.id === ws.id && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 rounded-xl">
                <Plus className="size-4" /> New workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-300",
                  active
                    ? "gradient-brand text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
                title={item.label}
              >
                <item.icon className="size-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="m-3 rounded-3xl bg-primary-soft p-4">
            <p className="text-sm font-bold text-primary">Trial ends in 6 days</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upgrade to Pro to keep unlimited projects and analytics.
            </p>
            <Button variant="hero" size="sm" className="mt-3 w-full">
              Upgrade plan
            </Button>
          </div>
        )}

        <div className="p-3">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className={cn("w-full text-muted-foreground", collapsed && "w-10")}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      </aside>

      <div className={cn("transition-[padding] duration-500", collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border glass px-4 sm:px-6">
          <Link to="/" className="lg:hidden">
            <Logo mark />
          </Link>

          <button
            onClick={() => setCmdOpen(true)}
            className="group ml-auto flex h-10 w-full max-w-md items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:shadow-soft lg:ml-0"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Search projects, tasks, people…</span>
            <span className="ml-auto hidden rounded-lg border border-border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
              ⌘K
            </span>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell />
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                      {unread}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[350px] rounded-3xl p-0">
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm font-bold">Notifications</p>
                  <span className="text-xs font-semibold text-primary">Mark all read</span>
                </div>
                <div className="max-h-[380px] overflow-y-auto border-t border-border">
                  {notifications.map((n, i) => (
                    <div
                      key={n.id}
                      className="flex gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50"
                      style={{ animation: `slide-in-right .35s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` }}
                    >
                      <span
                        className={cn(
                          "mt-1 size-2 shrink-0 rounded-full",
                          n.unread ? "gradient-brand" : "bg-border",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{n.time} ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-2xl p-1 pr-2 transition-colors hover:bg-muted">
                  <span
                    className="grid size-8 place-items-center rounded-xl text-xs font-bold text-primary-foreground"
                    style={{ background: members[0]!.color }}
                  >
                    {members[0]!.initials}
                  </span>
                  <span className="hidden text-sm font-semibold sm:inline">Ava</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel>
                  <p className="text-sm font-bold">Ava Mitchell</p>
                  <p className="text-xs font-normal text-muted-foreground">ava@syncspace.io</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link to="/app/settings">Profile & settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl">Keyboard shortcuts</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link to="/signin">Sign out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main key={pathname} className="animate-fade-up px-4 pb-28 pt-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border glass px-2 py-2 lg:hidden">
        {nav.slice(0, 5).map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      <Button
        variant="hero"
        size="icon"
        className="fixed bottom-20 right-5 z-40 size-14 rounded-3xl lg:bottom-8 lg:right-8"
        aria-label="Quick create"
      >
        <Plus className="!size-6" />
      </Button>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Search projects, tasks and teammates…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Projects">
            {projects.slice(0, 4).map((p) => (
              <CommandItem key={p.id}>{p.name}</CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="People">
            {members.slice(0, 4).map((m) => (
              <CommandItem key={m.id}>{m.name}</CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem>Create new project</CommandItem>
            <CommandItem>Invite teammate</CommandItem>
            <CommandItem>Upload file</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
