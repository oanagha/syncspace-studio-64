import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Counter } from "@/components/ux/motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  analyticsQueryKey,
  getAnalyticsDashboard,
  greetingForHour,
  systemLabel,
} from "@/services/analytics.service";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SyncSpace" },
      {
        name: "description",
        content:
          "Track productivity score, active projects, deadlines and live team activity across your SyncSpace workspace.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;

  const query = useQuery({
    queryKey: analyticsQueryKey(workspaceId, "7d"),
    queryFn: () => getAnalyticsDashboard(workspaceId!, "7d"),
    enabled: Number.isInteger(workspaceId) && (workspaceId ?? 0) > 0,
  });

  if (workspaceLoading || query.isLoading) {
    return <DashboardSkeleton />;
  }

  if (!workspaceId) {
    return (
      <EmptyState
        title="Select a workspace"
        message="Choose a workspace to see live dashboard stats."
      />
    );
  }

  if (query.isError) {
    const err = query.error;
    return (
      <EmptyState
        title="Couldn’t load dashboard"
        message={
          err instanceof ApiRequestError || err instanceof Error
            ? err.message
            : "Failed to load analytics"
        }
      />
    );
  }

  const data = query.data;
  if (!data) return null;

  const score = data.productivity_score;
  const firstName = data.user.first_name || data.user.name.split(" ")[0] || "there";
  const dueCount = data.kpis.due_today_count;
  const reviews = data.kpis.reviews_waiting;
  const donut = data.status_breakdown;
  const donutTotal = donut.reduce((sum, item) => sum + item.value, 0) || 1;
  const kpis = [
    { label: "Tasks", value: data.kpis.total_tasks, suffix: "", solid: "primary" as const },
    { label: "Completion", value: data.kpis.completion, suffix: "%", solid: "" as const },
    { label: "Velocity", value: data.kpis.velocity, suffix: "/d", solid: "" as const, decimals: 1 },
    { label: "Hours saved", value: data.kpis.hours_saved, suffix: "", solid: "secondary" as const },
  ];
  const hasProjects = data.project_health.length > 0;
  const hasActivity = data.activity.length > 0;
  const hasDue = data.due_today.length > 0;
  const hasThroughput = data.throughput.some((point) => point.created > 0 || point.completed > 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header
        className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 border-b-2 border-accent/30 pb-8"
        style={{ animation: "fade-up .28s cubic-bezier(.22,1,.36,1) both" }}
      >
        <div className="min-w-0 space-y-1">
          <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase leading-[1.05] tracking-tight text-foreground sm:text-4xl">
            <span className="text-muted-foreground">System:</span>{" "}
            <span className="gradient-text">{systemLabel(score)}</span>
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {greetingForHour()}, {firstName}. {dueCount} task{dueCount === 1 ? "" : "s"} due today,{" "}
            {reviews} review{reviews === 1 ? "" : "s"} waiting.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary sm:text-xs">
            Productivity score
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-5xl text-primary sm:text-7xl">
              <Counter to={score} />
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl text-accent sm:text-2xl">
              %
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="space-y-8 md:col-span-8">
          <section
            className="surface-card overflow-hidden rounded-3xl p-6 sm:p-8"
            style={{ animation: "fade-up .28s cubic-bezier(.22,1,.36,1) 30ms both" }}
          >
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="heading-dot text-lg uppercase tracking-tight text-primary sm:text-xl">
                  System throughput
                </h2>
                <p className="text-[11px] font-bold uppercase tracking-widest text-secondary/70">
                  Last 7 days
                </p>
              </div>
              <div className="flex gap-5 text-[10px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2 text-secondary">
                  <span className="size-2 rounded-full bg-secondary" /> Completed
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2 rounded-full bg-muted-foreground/40" /> Created
                </span>
              </div>
            </div>
            <div className="h-64">
              {hasThroughput ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.throughput}>
                    <defs>
                      <linearGradient id="ed1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2d8a9e" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#2d8a9e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      width={26}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-soft)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="#1a4a6e"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      strokeOpacity={0.35}
                      fill="none"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#2d8a9e"
                      strokeWidth={4}
                      fill="url(#ed1)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ChartEmpty message="No task activity in the last 7 days." />
              )}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {kpis.map((k, i) => (
              <div
                key={k.label}
                className={`rounded-2xl p-5 sm:p-6 ${
                  k.solid === "primary"
                    ? "bg-primary text-primary-foreground"
                    : k.solid === "secondary"
                      ? "bg-secondary text-secondary-foreground"
                      : "border border-accent/25 bg-card"
                }`}
                style={{
                  animation: `fade-up .28s cubic-bezier(.22,1,.36,1) ${Math.min(i * 25, 100)}ms both`,
                }}
              >
                <p
                  className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    k.solid ? "opacity-80" : "text-secondary"
                  }`}
                >
                  {k.label}
                </p>
                <h3
                  className={`font-[family-name:var(--font-display)] text-2xl sm:text-3xl ${k.solid ? "" : "text-primary"}`}
                >
                  <Counter to={k.value} suffix={k.suffix} decimals={k.decimals ?? 0} />
                </h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div
              className="space-y-4"
              style={{ animation: "fade-up .28s cubic-bezier(.22,1,.36,1) 90ms both" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="heading-dot text-base uppercase tracking-tight text-primary sm:text-lg">
                  Active projects
                </h2>
                <Link
                  to="/app/projects"
                  className="text-[10px] font-bold uppercase tracking-widest text-secondary hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {hasProjects ? (
                  data.project_health.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      to="/app/projects/$id"
                      params={{ id: String(p.id) }}
                      className="flex items-center justify-between gap-3 rounded-xl border border-accent/15 bg-card p-4 border-l-4"
                      style={{ borderLeftColor: p.accent }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{p.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {p.done}/{p.tasks} tasks
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                        style={{ background: `${p.accent}1f`, color: p.accent }}
                      >
                        {p.status}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    No projects yet. Create one to see health here.
                  </p>
                )}
              </div>
            </div>

            <div
              className="space-y-4"
              style={{ animation: "fade-up .28s cubic-bezier(.22,1,.36,1) 100ms both" }}
            >
              <h2 className="heading-dot text-base uppercase tracking-tight text-primary sm:text-lg">
                Team activity
              </h2>
              <div className="space-y-4">
                {hasActivity ? (
                  data.activity.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex gap-3">
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-card text-[10px] font-bold text-primary-foreground shadow-sm"
                        style={{ background: a.user.color || "#1A4A6E" }}
                      >
                        {a.user.initials || "?"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm">
                          <strong>{a.user.name}</strong>{" "}
                          <span className="text-muted-foreground">{a.action}</span>{" "}
                          <span className="font-semibold text-secondary">{a.target}</span>
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {a.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    Activity will show up as the team creates tasks and comments.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 md:col-span-4">
          <section
            className="surface-card rounded-3xl p-6 sm:p-8"
            style={{ animation: "fade-up .28s cubic-bezier(.22,1,.36,1) 60ms both" }}
          >
            <h2 className="heading-dot text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Task distribution
            </h2>
            {donut.length > 0 ? (
              <>
                <div className="relative mx-auto mt-6 h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donut}
                        dataKey="value"
                        innerRadius={62}
                        outerRadius={78}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {donut.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 14, border: "1px solid var(--border)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-[family-name:var(--font-display)] text-3xl text-primary">
                      {donut.length}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                      Core sectors
                    </span>
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  {donut.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="size-2 rounded-full" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-[family-name:var(--font-display)] text-primary">
                        {Math.round((d.value / donutTotal) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                No tasks to chart yet.
              </p>
            )}
          </section>

          <section
            className="rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8"
            style={{ animation: "fade-up .28s cubic-bezier(.22,1,.36,1) 80ms both" }}
          >
            <h2 className="heading-dot text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Due today
            </h2>
            <div className="space-y-6">
              {hasDue ? (
                data.due_today.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-start justify-between gap-3 border-l-2 pl-4"
                    style={{ borderColor: i % 2 === 0 ? "#5cbdb9" : "#2d8a9e" }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">{t.title}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {t.assignee.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold">{t.due}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm opacity-80">Nothing due today.</p>
              )}
            </div>
            <div className="mt-8 space-y-4 border-t border-primary-foreground/15 pt-6">
              <h3 className="heading-dot text-xs font-bold uppercase tracking-[0.2em] text-accent">
                Deadlines
              </h3>
              {hasProjects ? (
                data.project_health.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-semibold">{p.name}</span>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {p.due || "No date"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm opacity-80">No project deadlines yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="outline">
        <Link to="/app/projects">Go to projects</Link>
      </Button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-end justify-between gap-6 border-b-2 border-accent/30 pb-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-16 w-24" />
      </div>
      <div className="grid gap-8 md:grid-cols-12">
        <div className="space-y-6 md:col-span-8">
          <Skeleton className="h-80 rounded-3xl" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        </div>
        <Skeleton className="h-96 rounded-3xl md:col-span-4" />
      </div>
    </div>
  );
}
