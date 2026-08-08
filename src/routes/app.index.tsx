import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { AnimatedBar, Counter, ProgressRing } from "@/components/ux/motion";
import { activity, donutData, files, memberOf, projects, tasks, weeklyData } from "@/lib/data";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SyncSpace" },
      { name: "description", content: "Track productivity score, active projects, deadlines and live team activity across your SyncSpace workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <DashboardSkeleton />;

  const dueToday = tasks.filter((t) => t.column !== "Done").slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl gradient-brand p-7 text-primary-foreground sm:p-10">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-24 right-32 size-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <Sparkles className="size-3.5" /> Friday, 8 August
            </p>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Good morning, Ava 👋</h1>
            <p className="mt-2 max-w-xl text-sm/relaxed opacity-90">
              You have <strong>7 tasks</strong> due today and <strong>3 reviews</strong> waiting.
              Northwind Studio shipped 38 tasks this week — a new record.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="glass" asChild>
                <Link to="/app/board">Open board</Link>
              </Button>
              <Button variant="glass" asChild>
                <Link to="/app/analytics">View analytics</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            {[
              { label: "Tasks done", value: 412 },
              { label: "Hours saved", value: 128 },
              { label: "Active projects", value: 6 },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/15 p-4 backdrop-blur-md">
                <p className="text-2xl font-extrabold">
                  <Counter to={s.value} />
                </p>
                <p className="mt-1 text-[11px] opacity-90">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Productivity score" value={87} suffix="" ring color="#1A4A6E" delta="+6 vs last week" />
            <StatCard title="Completion rate" value={92} suffix="%" color="#2F9E7D" delta="+3.4% this sprint" />
            <StatCard title="Avg. cycle time" value={2.4} suffix="d" decimals={1} color="#5CBDB9" delta="−0.6d faster" />
          </div>

          <div className="surface-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Throughput this week</h2>
                <p className="text-sm text-muted-foreground">Tasks created vs completed</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                <TrendingUp className="size-3.5" /> +18.2%
              </span>
            </div>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1A4A6E" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#1A4A6E" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5CBDB9" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#5CBDB9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={28} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-soft)",
                    }}
                  />
                  <Area type="monotone" dataKey="completed" stroke="#1A4A6E" strokeWidth={3} fill="url(#g1)" />
                  <Area type="monotone" dataKey="created" stroke="#5CBDB9" strokeWidth={3} fill="url(#g2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-6">
              <h2 className="text-lg font-bold">Task distribution</h2>
              <div className="mt-2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {donutData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {donutData.map((d) => (
                  <span key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name} · {d.value}
                  </span>
                ))}
              </div>
            </div>

            <div className="surface-card p-6">
              <h2 className="text-lg font-bold">Weekly velocity</h2>
              <div className="mt-2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip
                      cursor={{ fill: "var(--muted)" }}
                      contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }}
                    />
                    <Bar dataKey="completed" radius={[10, 10, 10, 10]} fill="#2D8A9E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground">
                Median 24 tasks/day across 6 active projects.
              </p>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Active projects</h2>
              <Link to="/app/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                View all <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              {projects.slice(0, 4).map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4"
                  style={{ animation: `fade-up .6s cubic-bezier(.22,1,.36,1) ${i * 90}ms both` }}
                >
                  <span className="size-10 shrink-0 rounded-2xl" style={{ background: `${p.accent}1f` }}>
                    <span className="grid size-full place-items-center text-xs font-bold" style={{ color: p.accent }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold">{p.name}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{p.done}/{p.tasks}</span>
                    </div>
                    <div className="mt-2">
                      <AnimatedBar value={p.progress} color={p.accent} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="surface-card p-6">
            <h2 className="text-lg font-bold">Tasks due today</h2>
            <ul className="mt-4 space-y-3">
              {dueToday.map((t) => (
                <li key={t.id} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {memberOf(t.assignee).name} · {t.due}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-lg font-bold">Team activity</h2>
            <ul className="mt-4 space-y-4">
              {activity.map((a, i) => {
                const m = memberOf(a.user);
                return (
                  <li
                    key={a.id}
                    className="flex gap-3"
                    style={{ animation: `slide-in-right .4s cubic-bezier(.22,1,.36,1) ${i * 70}ms both` }}
                  >
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-xl text-[10px] font-bold text-primary-foreground"
                      style={{ background: m.color }}
                    >
                      {m.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm">
                        <strong>{m.name}</strong>{" "}
                        <span className="text-muted-foreground">{a.action}</span> {a.target}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-lg font-bold">Upcoming deadlines</h2>
            <ul className="mt-4 space-y-3">
              {projects.slice(0, 3).map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                  <CalendarClock className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Due {p.due}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-lg font-bold">Recent files</h2>
            <ul className="mt-4 space-y-3">
              {files.slice(0, 4).map((f) => (
                <li key={f.id} className="flex items-center gap-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold"
                    style={{ background: `${f.color}1f`, color: f.color }}
                  >
                    {f.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.size} · {f.updated}</p>
                  </div>
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  suffix = "",
  decimals = 0,
  color,
  delta,
  ring,
}: {
  title: string;
  value: number;
  suffix?: string;
  decimals?: number;
  color: string;
  delta: string;
  ring?: boolean;
}) {
  return (
    <div className="surface-card hover-lift flex items-center gap-4 p-5">
      {ring ? (
        <ProgressRing value={value} color={color} />
      ) : (
        <span className="grid size-12 place-items-center rounded-2xl" style={{ background: `${color}1f` }}>
          <Clock className="size-5" style={{ color }} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-2xl font-extrabold">
          <Counter to={value} suffix={suffix} decimals={decimals} />
        </p>
        <p className="text-xs text-success">{delta}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="h-52 rounded-3xl skeleton-shimmer" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-3xl skeleton-shimmer" />
        ))}
      </div>
      <div className="h-80 rounded-3xl skeleton-shimmer" />
    </div>
  );
}
