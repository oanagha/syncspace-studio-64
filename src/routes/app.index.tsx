import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { activity, donutData, memberOf, projects, tasks, weeklyData } from "@/lib/data";

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


  const dueToday = tasks.filter((t) => t.column !== "Done").slice(0, 4);
  const total = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Editorial header */}
      <header
        className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 border-b-2 border-accent/30 pb-8"
        style={{ animation: "fade-up .6s cubic-bezier(.22,1,.36,1) both" }}
      >
        <div className="min-w-0 space-y-1">
          <h1 className="heading-elegant text-4xl uppercase leading-[0.95] tracking-tighter text-primary sm:text-5xl xl:text-6xl">
            System: <span className="gradient-text">Optimal</span>
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Good morning, Ava. 7 tasks due today, 3 reviews waiting.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary sm:text-xs">
            Productivity score
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-5xl text-primary sm:text-7xl">
              <Counter to={87} />
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl text-accent sm:text-2xl">%</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Left axis */}
        <div className="space-y-8 md:col-span-8">
          <section
            className="surface-card overflow-hidden rounded-3xl p-6 sm:p-8"
            style={{ animation: "fade-up .6s cubic-bezier(.22,1,.36,1) 80ms both" }}
          >
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="heading-dot text-lg uppercase tracking-tight text-primary sm:text-xl">System throughput</h2>
                <p className="text-[11px] font-bold uppercase tracking-widest text-secondary/70">Live telemetry</p>
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="ed1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2d8a9e" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2d8a9e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} width={26} />
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
                  <Area type="monotone" dataKey="completed" stroke="#2d8a9e" strokeWidth={4} fill="url(#ed1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* KPI ribbon */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Tasks", value: 412, suffix: "", solid: "primary" },
              { label: "Completion", value: 92, suffix: "%", solid: "" },
              { label: "Velocity", value: 24, suffix: "/d", solid: "" },
              { label: "Hours saved", value: 128, suffix: "", solid: "secondary" },
            ].map((k, i) => (
              <div
                key={k.label}
                className={`rounded-2xl p-5 sm:p-6 ${
                  k.solid === "primary"
                    ? "bg-primary text-primary-foreground"
                    : k.solid === "secondary"
                      ? "bg-secondary text-secondary-foreground"
                      : "border border-accent/25 bg-card"
                }`}
                style={{ animation: `fade-up .5s cubic-bezier(.22,1,.36,1) ${140 + i * 60}ms both` }}
              >
                <p
                  className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    k.solid ? "opacity-80" : "text-secondary"
                  }`}
                >
                  {k.label}
                </p>
                <h3 className={`font-[family-name:var(--font-display)] text-2xl sm:text-3xl ${k.solid ? "" : "text-primary"}`}>
                  <Counter to={k.value} suffix={k.suffix} />
                </h3>
              </div>
            ))}
          </div>

          {/* Projects + activity */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-4" style={{ animation: "fade-up .6s cubic-bezier(.22,1,.36,1) 360ms both" }}>
              <div className="flex items-center justify-between">
                <h2 className="heading-dot text-base uppercase tracking-tight text-primary sm:text-lg">Active projects</h2>
                <Link to="/app/projects" className="text-[10px] font-bold uppercase tracking-widest text-secondary hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {projects.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
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
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4" style={{ animation: "fade-up .6s cubic-bezier(.22,1,.36,1) 420ms both" }}>
              <h2 className="heading-dot text-base uppercase tracking-tight text-primary sm:text-lg">Team activity</h2>
              <div className="space-y-4">
                {activity.slice(0, 5).map((a) => {
                  const m = memberOf(a.user);
                  return (
                    <div key={a.id} className="flex gap-3">
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-card text-[10px] font-bold text-primary-foreground shadow-sm"
                        style={{ background: m.color }}
                      >
                        {m.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm">
                          <strong>{m.name}</strong>{" "}
                          <span className="text-muted-foreground">{a.action}</span>{" "}
                          <span className="font-semibold text-secondary">{a.target}</span>
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{a.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right focus panel */}
        <div className="space-y-8 md:col-span-4">
          <section
            className="surface-card rounded-3xl p-6 sm:p-8"
            style={{ animation: "fade-up .6s cubic-bezier(.22,1,.36,1) 160ms both" }}
          >
            <h2 className="heading-dot text-xs font-bold uppercase tracking-[0.2em] text-primary">Task distribution</h2>
            <div className="relative mx-auto mt-6 h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={62} outerRadius={78} paddingAngle={4} stroke="none">
                    {donutData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--border)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-[family-name:var(--font-display)] text-3xl text-primary">{donutData.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Core sectors</span>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="size-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-primary">
                    {Math.round((d.value / total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section
            className="rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8"
            style={{ animation: "fade-up .6s cubic-bezier(.22,1,.36,1) 220ms both" }}
          >
            <h2 className="heading-dot text-xs font-bold uppercase tracking-[0.2em] text-accent">Due today</h2>
            <div className="space-y-6">
              {dueToday.map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between gap-3 border-l-2 pl-4"
                  style={{ borderColor: i % 2 === 0 ? "#5cbdb9" : "#2d8a9e" }}
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{t.title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                      {memberOf(t.assignee).name}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold">{t.due}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-4 border-t border-primary-foreground/15 pt-6">
              <h3 className="heading-dot text-xs font-bold uppercase tracking-[0.2em] text-accent">Deadlines</h3>
              {projects.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold">{p.name}</span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider opacity-70">{p.due}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="h-28 rounded-2xl skeleton-shimmer" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="space-y-8 md:col-span-8">
          <div className="h-80 rounded-3xl skeleton-shimmer" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />
            ))}
          </div>
        </div>
        <div className="space-y-8 md:col-span-4">
          <div className="h-80 rounded-3xl skeleton-shimmer" />
          <div className="h-60 rounded-3xl skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
