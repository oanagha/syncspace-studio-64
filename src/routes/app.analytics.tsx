import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Counter, ProgressRing } from "@/components/ux/motion";
import { cn } from "@/lib/utils";
import { ApiRequestError } from "@/lib/api";
import { exportAnalyticsPdf } from "@/lib/export-analytics-pdf";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  analyticsQueryKey,
  formatUpdatedAt,
  getAnalyticsDashboard,
  RANGE_LABELS,
  type AnalyticsRange,
} from "@/services/analytics.service";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SyncSpace Workspace" },
      {
        name: "description",
        content:
          "Team productivity trends, completion rates, workload distribution and project health in one interactive report.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [exporting, setExporting] = useState(false);
  const workspaceId = activeWorkspace?.id ?? null;
  const workspaceName = activeWorkspace?.name || "Workspace";

  const query = useQuery({
    queryKey: analyticsQueryKey(workspaceId, range),
    queryFn: () => getAnalyticsDashboard(workspaceId!, range),
    enabled: Number.isInteger(workspaceId) && (workspaceId ?? 0) > 0,
  });

  if (workspaceLoading || query.isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (!workspaceId) {
    return (
      <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Select a workspace</h1>
        <p className="text-sm text-muted-foreground">Analytics are scoped to the active workspace.</p>
      </div>
    );
  }

  if (query.isError) {
    const err = query.error;
    return (
      <div className="surface-card mx-auto grid max-w-lg place-items-center gap-3 px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Couldn’t load analytics</h1>
        <p className="text-sm text-muted-foreground">
          {err instanceof ApiRequestError || err instanceof Error ? err.message : "Failed to load analytics"}
        </p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const data = query.data;
  if (!data) return null;

  const trend = data.throughput;
  const donut = data.status_breakdown;
  const workload = data.workload;
  const projects = data.project_health;
  const stats = [
    {
      label: "Tasks completed",
      value: data.stats.tasks_completed,
      suffix: "",
      delta: data.stats.tasks_completed_delta,
      decimals: 0,
    },
    {
      label: "Avg. cycle time",
      value: data.stats.avg_cycle_time,
      suffix: "d",
      delta: data.stats.cycle_time_delta,
      decimals: 1,
    },
    {
      label: "On-time delivery",
      value: data.stats.on_time_delivery,
      suffix: "%",
      delta: data.stats.on_time_delta,
      decimals: 0,
    },
    {
      label: "Active collaborators",
      value: data.stats.active_collaborators,
      suffix: "",
      delta: data.stats.collaborators_delta,
      decimals: 0,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {workspaceName} · updated {formatUpdatedAt(data.generated_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border p-1">
          {RANGE_LABELS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                range === r.value
                  ? "gradient-brand text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {query.isFetching && (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Refreshing…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="surface-card hover-lift p-5"
            style={{ animation: `fade-up .28s cubic-bezier(.22,1,.36,1) ${Math.min(i * 20, 100)}ms both` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-3xl font-extrabold">
              <Counter to={s.value} suffix={s.suffix} decimals={s.decimals} />
            </p>
            <p className="mt-1 text-xs font-semibold text-success">{s.delta} vs previous period</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">Task completion trend</h2>
          <p className="text-sm text-muted-foreground">Completed vs created for the selected range</p>
          <div className="mt-6 h-72">
            {trend.some((point) => point.completed > 0 || point.created > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }} />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#1A4A6E"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 0, fill: "#1A4A6E" }}
                    animationDuration={1400}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#5CBDB9"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    dot={false}
                    animationDuration={1600}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No completions in this range.
              </div>
            )}
          </div>
        </section>

        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">Status mix</h2>
          {donut.length > 0 ? (
            <>
              <div className="mt-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut} dataKey="value" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none">
                      {donut.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {donut.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="size-2.5 rounded-full" style={{ background: d.color }} /> {d.name}
                    </span>
                    <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-8 text-center text-sm text-muted-foreground">No tasks in this workspace yet.</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">Workload distribution</h2>
          <div className="mt-4 h-64">
            {workload.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workload} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={64} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }}
                  />
                  <Bar dataKey="value" radius={12}>
                    {workload.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Assign tasks to teammates to see workload.
              </div>
            )}
          </div>
        </section>

        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">Project health</h2>
          {projects.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
              {projects.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to="/app/projects/$id"
                  params={{ id: String(p.id) }}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <ProgressRing value={p.progress} color={p.accent} size={72} />
                  <p className="line-clamp-2 text-xs font-semibold">{p.name}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Create a project to track health rings here.
            </p>
          )}
        </section>
      </div>

      <section className="surface-card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-lg font-bold">Export report</h2>
          <p className="text-sm text-muted-foreground">
            Opens print — choose “Save as PDF” to download the current range.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="hero"
            disabled={exporting || !data}
            onClick={async () => {
              if (!data) {
                toast.error("Analytics data is still loading.");
                return;
              }
              setExporting(true);
              const toastId = toast.loading("Print dialog open — choose Save as PDF");
              try {
                await exportAnalyticsPdf({
                  workspaceName,
                  range,
                  data,
                });
                toast.success("Export complete", { id: toastId });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to export PDF.", {
                  id: toastId,
                });
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : null}
            {exporting ? "Preparing…" : "Export PDF"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-64 rounded-2xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
      <Skeleton className="h-80 rounded-3xl" />
    </div>
  );
}
