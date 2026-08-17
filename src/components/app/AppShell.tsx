import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  FolderKanban,
  Files,
  Gauge,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Shield,
  Users,
  UserPlus,
  CloudUpload,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { clearAuth, getToken, getUser } from "@/lib/auth";
import {
  formatNotificationTime,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationQueryKey,
  type AppNotification,
  type NotificationsPayload,
} from "@/services/notification.service";
import { usePreferences } from "@/hooks/usePreferences";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceSwitcher } from "@/components/workspace/WorkspaceSwitcher";
import { CreateWorkspaceModal } from "@/components/workspace/CreateWorkspaceModal";
import { workspaceInitials } from "@/services/workspace.service";
import { resolveAvatarUrl } from "@/services/settings.service";
import { getTask } from "@/services/task.service";
import { listProjects, memberAvatarColor, projectQueryKey } from "@/services/project.service";
import { listMembers, teamMembersQueryKey } from "@/services/team.service";
import { ApiRequestError } from "@/lib/api";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/projects", label: "Projects", icon: FolderKanban, exact: false },
  { to: "/app/team", label: "Team", icon: Users, exact: false },
  { to: "/app/files", label: "Files", icon: Files, exact: false },
  { to: "/app/analytics", label: "Analytics", icon: Gauge, exact: false },
  { to: "/app/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AppShell() {
  const { preferences, updatePreferences } = usePreferences();
  const [collapsed, setCollapsed] = useState(preferences.sidebar === "collapsed");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [newWsOpen, setNewWsOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const user = getUser();
  const userName = preferences.fullName || user?.name || "Account";
  const userEmail = preferences.email || user?.email || "";
  const avatarSrc = resolveAvatarUrl(preferences.avatarUrl ?? user?.avatarUrl ?? null);
  const queryClient = useQueryClient();
  const notificationsEnabled = preferences.notifications;
  const notificationsQuery = useQuery({
    queryKey: notificationQueryKey(),
    queryFn: listNotifications,
    enabled: Boolean(getToken()) && notificationsEnabled,
    refetchOnWindowFocus: true,
  });
  const notes = notificationsQuery.data?.notifications ?? [];
  const workspaceId = activeWorkspace?.id ?? null;

  const paletteProjectsQuery = useQuery({
    queryKey: projectQueryKey(workspaceId, "", "all", "recent"),
    queryFn: () =>
      listProjects({
        workspaceId: workspaceId!,
        search: "",
        status: "all",
        sort: "recent",
      }),
    enabled:
      Boolean(getToken()) && Number.isInteger(workspaceId) && (workspaceId ?? 0) > 0 && cmdOpen,
  });

  const paletteMembersQuery = useQuery({
    queryKey: teamMembersQueryKey(workspaceId),
    queryFn: () => listMembers(workspaceId!),
    enabled:
      Boolean(getToken()) && Number.isInteger(workspaceId) && (workspaceId ?? 0) > 0 && cmdOpen,
  });

  const paletteProjects = paletteProjectsQuery.data?.projects ?? [];
  const paletteMembers = paletteMembersQuery.data?.members ?? [];

  const patchNotificationCache = useCallback(
    (updater: (current: NotificationsPayload) => NotificationsPayload) => {
      queryClient.setQueryData(
        notificationQueryKey(),
        (current: NotificationsPayload | undefined) => {
          if (!current) return current;
          return updater(current);
        },
      );
    },
    [queryClient],
  );

  const markOneMutation = useMutation({
    mutationFn: (notification: AppNotification) => markNotificationRead(notification.id),
    onSuccess: (data, notification) => {
      patchNotificationCache((current) => {
        const notifications = current.notifications.map((item) =>
          item.id === notification.id
            ? { ...item, unread: false, read_at: data.notification.read_at }
            : item,
        );
        return {
          notifications,
          unread_count: notifications.filter((item) => item.unread).length,
        };
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to mark as read.",
      );
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      patchNotificationCache((current) => ({
        unread_count: 0,
        notifications: current.notifications.map((item) => ({
          ...item,
          unread: false,
          read_at: item.read_at || new Date().toISOString(),
        })),
      }));
      toast.success("All notifications marked as read");
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Failed to mark all as read.",
      );
    },
  });

  const openNotification = async (notification: AppNotification) => {
    if (notification.unread && markOneMutation.isPending) return;

    try {
      if (notification.unread) {
        await markOneMutation.mutateAsync(notification);
      }

      let projectId = notification.project_id ?? null;
      if (!projectId && notification.task_id) {
        const { task } = await getTask(notification.task_id);
        projectId = task.project_id;
      }

      if (projectId) {
        navigate({
          to: "/app/projects/$id/board",
          params: { id: String(projectId) },
        });
      }
    } catch (err) {
      if (err instanceof ApiRequestError) return;
      toast.error(err instanceof Error ? err.message : "Failed to open notification.");
    }
  };
  const userInitials = workspaceInitials(userName);

  useEffect(() => {
    setCollapsed(preferences.sidebar === "collapsed");
  }, [preferences.sidebar]);

  const setSidebarCollapsed = useCallback(
    (next: boolean) => {
      setCollapsed(next);
      if ((next ? "collapsed" : "expanded") !== preferences.sidebar) {
        void updatePreferences({ sidebar: next ? "collapsed" : "expanded" }).catch(() => {
          setCollapsed(preferences.sidebar === "collapsed");
          toast.error("Could not save sidebar preference.");
        });
      }
    },
    [preferences.sidebar, updatePreferences],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSidebarCollapsed(!collapsed);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [collapsed, setSidebarCollapsed]);

  const unread = notificationsQuery.data?.unread_count ?? notes.filter((n) => n.unread).length;
  const isProjectDetail = /^\/app\/projects\/[^/]+/.test(pathname);
  const mustEnroll2fa = preferences.require2fa && !preferences.twoFactor;

  useEffect(() => {
    if (!mustEnroll2fa) return;
    if (pathname.startsWith("/app/settings")) return;
    void navigate({ to: "/app/settings", search: { tab: "security" } });
  }, [mustEnroll2fa, navigate, pathname]);

  const go = (to: string) => {
    setCmdOpen(false);
    navigate({ to });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] lg:flex",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-2")}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-2xl transition-transform hover:scale-[1.03]"
          >
            {collapsed ? <Logo mark /> : <Logo />}
          </button>
        </div>

        <div className="px-3">
          <WorkspaceSwitcher collapsed={collapsed} onCreateWorkspace={() => setNewWsOpen(true)} />
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                preload="render"
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
            <p className="text-sm font-bold text-primary">Trial ends in 14 days</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upgrade to Pro to keep unlimited projects and analytics.
            </p>
            <Button variant="hero" size="sm" className="mt-3 w-full" asChild>
              <Link to="/pricing">Upgrade plan</Link>
            </Button>
          </div>
        )}
      </aside>

      <div
        className={cn(
          "transition-[padding] duration-500",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]",
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border glass px-4 sm:px-6">
          <Link to="/" className="lg:hidden">
            <Logo mark />
          </Link>
          <div className="lg:hidden">
            <WorkspaceSwitcher collapsed onCreateWorkspace={() => setNewWsOpen(true)} />
          </div>

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
                  <button
                    onClick={() => {
                      if (markAllMutation.isPending || unread === 0) return;
                      markAllMutation.mutate();
                    }}
                    className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                    disabled={unread === 0 || markAllMutation.isPending}
                  >
                    {markAllMutation.isPending ? "Marking…" : "Mark all read"}
                  </button>
                </div>
                <div className="max-h-[380px] overflow-y-auto border-t border-border">
                  {!notificationsEnabled ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Notifications are turned off in Settings.
                    </p>
                  ) : notificationsQuery.isLoading ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Loading notifications…
                    </p>
                  ) : notes.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No notifications yet. Mentions will show up here.
                    </p>
                  ) : (
                    notes.map((n, i) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          void openNotification(n);
                        }}
                        disabled={
                          markOneMutation.isPending && markOneMutation.variables?.id === n.id
                        }
                        className="flex w-full gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted/50 disabled:opacity-60"
                        style={{
                          animation: `slide-in-right .35s cubic-bezier(.22,1,.36,1) ${i * 60}ms both`,
                        }}
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
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatNotificationTime(n.created_at)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-2xl p-1 pr-2 transition-colors hover:bg-muted">
                  <span
                    className="grid size-8 place-items-center overflow-hidden rounded-xl text-xs font-bold text-primary-foreground"
                    style={{
                      background: avatarSrc
                        ? `center / cover url(${avatarSrc})`
                        : memberAvatarColor(user?.id ?? 0),
                    }}
                  >
                    {!avatarSrc && userInitials}
                  </span>
                  <span className="hidden text-sm font-semibold sm:inline">
                    {userName.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel>
                  <p className="text-sm font-bold">{userName}</p>
                  <p className="text-xs font-normal text-muted-foreground">{userEmail}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link to="/app/settings">Profile & settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl"
                  onSelect={() => {
                    clearAuth();
                    navigate({ to: "/" });
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main
          key={`${activeWorkspace?.id ?? "none"}-${pathname}`}
          className="px-4 pb-28 pt-6 sm:px-6 lg:px-8"
          style={{ animation: "fade-up .22s cubic-bezier(.22,1,.36,1) both" }}
        >
          {mustEnroll2fa ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <Shield className="mt-0.5 size-4 shrink-0 text-warning" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">Two-factor authentication required</p>
                  <p className="text-xs text-muted-foreground">
                    Enable 2FA to keep using this workspace.
                  </p>
                </div>
              </div>
              <Button variant="hero" size="sm" asChild>
                <Link to="/app/settings" search={{ tab: "security" }}>
                  Enable 2FA
                </Link>
              </Button>
            </div>
          ) : null}
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
              preload="render"
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

      {!isProjectDetail && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="hero"
              size="icon"
              className="fixed bottom-20 right-5 z-40 size-14 rounded-3xl lg:bottom-8 lg:right-8"
              aria-label="Quick create"
            >
              <Plus className="!size-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 rounded-2xl">
            <DropdownMenuLabel>Quick create</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 rounded-xl">
              <Link to="/app/projects">
                <FolderKanban className="size-4" /> New project
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 rounded-xl">
              <Link to="/app/team">
                <UserPlus className="size-4" /> Invite teammate
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 rounded-xl">
              <Link to="/app/files">
                <CloudUpload className="size-4" /> Upload file
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Search projects, tasks and teammates…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {nav.map((item) => (
              <CommandItem key={item.to} value={`go ${item.label}`} onSelect={() => go(item.to)}>
                <item.icon className="size-4" /> {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Projects">
            {paletteProjects.slice(0, 6).map((p) => (
              <CommandItem
                key={p.id}
                value={p.title}
                onSelect={() => {
                  setCmdOpen(false);
                  navigate({ to: "/app/projects/$id", params: { id: String(p.id) } });
                }}
              >
                {p.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="People">
            {paletteMembers.slice(0, 6).map((m) => (
              <CommandItem
                key={m.id}
                value={m.name}
                onSelect={() => {
                  setCmdOpen(false);
                  navigate({ to: "/app/team" });
                }}
              >
                {m.name}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => go("/app/projects")}>Create new project</CommandItem>
            <CommandItem onSelect={() => go("/app/team")}>Invite teammate</CommandItem>
            <CommandItem onSelect={() => go("/app/files")}>Upload file</CommandItem>
            <CommandItem
              onSelect={() => {
                setCmdOpen(false);
                setNewWsOpen(true);
              }}
            >
              New workspace
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <CreateWorkspaceModal open={newWsOpen} onOpenChange={setNewWsOpen} />
    </div>
  );
}
