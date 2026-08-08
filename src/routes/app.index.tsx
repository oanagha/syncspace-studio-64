import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
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

function Tile({
  className = "",
  children,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      className={`surface-card overflow-hidden p-5 sm:p-6 ${className}`}
      style={{ animation: `fade-up .6s cubic-bezier(.22,1,.36,1) ${delay}ms both` }}
    >
      {children}
    </section>
  );
}

function TileHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <DashboardSkeleton />;

  const dueToday = tasks.filter((t) => t.column !== "Done").slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-6">
        {/* Hero tile */}
        <section
          className="relative overflow-hidden rounded-2xl gradient-brand p-6 text-primary-foreground sm:p-8 md:col-span-4 xl:col-span-4"
          style={{ animation: "fade-up .6s cubic-bezier(.22,1,.36,1) both" }}
        >
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <Sparkles className="size-3.5" /> Saturday, 8 August
          </p>
          <h1 className="mt-4 text-3xl leading-tight sm:text-4xl">Good morning, Ava</h1>
          <p className="mt-2 max-w-lg text-sm/relaxed opacity-90">
            7 tasks due today, 3 reviews waiting. Northwind Studio shipped 38 tasks this week.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="glass" asChild>
              <Link to="/app/board">Open board</Link>
            </Button>
            <Button variant="glass" asChild>
              <Link to="/app/analytics">Analytics</Link>
            </Button>
          </div>
        </section>

        {/* Score tile */}
        <Tile className="flex flex-col items-center justify-center gap-3 text-center md:col-span-2 xl:col-span-2" delay={60}>
          <ProgressRing value={87} color="#1A4A6E" />
          <div>
            <p className="text-sm font-bold">Productivity score</p>
            <p className="text-xs text-success">+6 vs last week</p>
          </div>
        </Tile>

        {/* Micro stats */}
        {[
          { label: "Tasks done", value: 412, suffix: "" },
          { label: "Completion", value: 92, suffix: "%" },
          { label: "Cycle time", value: 2.4, suffix: "d", decimals: 1 },
          { label: "Hours saved", value: 128, suffix: "" },
        ].map((s, i) => (
          <Tile key={s.label} className="md:col-span-1" delay={120 + i * 50}>
            <p className="text-2xl font-extrabold">
              <Counter to={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
          </Tile>
        ))}

        {/* Throughput */}
        <Tile className="md:col-span-4 xl:col-span-4" delay={320}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <TileHead title="Throughput this week" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <TrendingUp className="size-3.5" /> +18.2%
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1A4A6E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1A4A6E" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5CBDB9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#5CBDB9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={28} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-soft)",
                  }}
                />
                <Area type="monotone" dataKey="completed" stroke="#1A4A6E" strokeWidth={3} fill="url(#g1)" />
                <Area type="monotone" dataKey="created" stroke="#5CBDB9" strokeWidth={3} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Tile>

        {/* Due today */}
        <Tile className="md:col-span-2 xl:col-span-2 md:row-span-2" delay={380}>
          <TileHead title="Due today" hint={`${dueToday.length} tasks`} />
          <ul className="space-y-3">
            {dueToday.map((t) => (
              <li key={t.id} className="flex items-start gap-3 rounded-xl bg-muted/60 p-3">
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
          <div className="mt-5 space-y-3 border-t border-border pt-5">
            <TileHead title="Deadlines" />
            {projects.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <CalendarClock className="size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Due {p.due}</p>
                </div>
                <span className="shrink-0 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </Tile>

        {/* Distribution */}
        <Tile className="md:col-span-2 xl:col-span-2" delay={420}>
          <TileHead title="Task distribution" />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                  {donutData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--border)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {donutData.map((d) => (
              <span key={d.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                {d.name} · {d.value}
              </span>
            ))}
          </div>
        </Tile>

        {/* Velocity */}
        <Tile className="md:col-span-2 xl:col-span-2" delay={460}>
          <TileHead title="Weekly velocity" hint="median 24/day" />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{ borderRadius: 14, border: "1px solid var(--border)" }}
                />
                <Bar dataKey="completed" radius={[8, 8, 8, 8]} fill="#2D8A9E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tile>

        {/* Projects */}
        <Tile className="md:col-span-2 xl:col-span-2" delay={500}>
          <div className="mb-4 flex items-center justify-between">
            <TileHead title="Active projects" />
            <Link to="/app/projects" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-4">
                <span className="size-9 shrink-0 rounded-xl" style={{ background: `${p.accent}1f` }}>
                  <span className="grid size-full place-items-center text-[11px] font-bold" style={{ color: p.accent }}>
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
        </Tile>

        {/* Activity */}
        <Tile className="md:col-span-2 xl:col-span-2" delay={540}>
          <TileHead title="Team activity" />
          <ul className="space-y-4">
            {activity.slice(0, 5).map((a, i) => {
              const m = memberOf(a.user);
              return (
                <li
                  key={a.id}
                  className="flex gap-3"
                  style={{ animation: `slide-in-right .4s cubic-bezier(.22,1,.36,1) ${i * 70}ms both` }}
                >
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-primary-foreground"
                    style={{ background: m.color }}
                  >
                    {m.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm">
                      <strong>{m.name}</strong> <span className="text-muted-foreground">{a.action}</span> {a.target}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Tile>

        {/* Files */}
        <Tile className="md:col-span-4 xl:col-span-2" delay={580}>
          <TileHead title="Files" />
          <ul className="space-y-3">
            {files.slice(0, 4).map((f) => (
              <li key={f.id} className="flex items-center gap-3">
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold"
                  style={{ background: `${f.color}1f`, color: f.color }}
                >
                  {f.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.size}</p>
                </div>
                <FileText className="size-4 shrink-0 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl auto-rows-min grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-6">
      <div className="h-56 rounded-2xl skeleton-shimmer md:col-span-4" />
      <div className="h-56 rounded-2xl skeleton-shimmer md:col-span-2" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />
      ))}
      <div className="h-72 rounded-2xl skeleton-shimmer md:col-span-4" />
      <div className="h-72 rounded-2xl skeleton-shimmer md:col-span-2" />
    </div>
  );
}
