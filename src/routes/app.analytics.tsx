import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Counter, ProgressRing } from "@/components/ux/motion";
import { donutData, projects, weeklyData, workloadData } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SyncSpace Workspace" },
      { name: "description", content: "Team productivity trends, completion rates, workload distribution and project health in one interactive report." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsPage,
});

const ranges = ["7 days", "30 days", "Quarter", "Year"];

const trend = [
  { week: "W1", completed: 96, target: 90 },
  { week: "W2", completed: 112, target: 100 },
  { week: "W3", completed: 88, target: 100 },
  { week: "W4", completed: 134, target: 110 },
  { week: "W5", completed: 152, target: 120 },
  { week: "W6", completed: 141, target: 130 },
  { week: "W7", completed: 168, target: 140 },
];

function AnalyticsPage() {
  const [range, setRange] = useState("30 days");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">Analytics</h1>
          <p className="text-sm text-muted-foreground">Northwind Studio · updated 4 minutes ago</p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border p-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                range === r ? "gradient-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tasks completed", value: 891, suffix: "", delta: "+22%" },
          { label: "Avg. cycle time", value: 2.4, suffix: "d", delta: "−0.6d", decimals: 1 },
          { label: "On-time delivery", value: 94, suffix: "%", delta: "+5%" },
          { label: "Active collaborators", value: 38, suffix: "", delta: "+6" },
        ].map((s, i) => (
          <div
            key={s.label}
            className="surface-card hover-lift p-5"
            style={{ animation: `fade-up .5s cubic-bezier(.22,1,.36,1) ${i * 70}ms both` }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              <Counter to={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
            </p>
            <p className="mt-1 text-xs font-semibold text-success">{s.delta} vs previous period</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">Task completion trend</h2>
          <p className="text-sm text-muted-foreground">Completed vs target, last 7 weeks</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
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
          </div>
        </section>

        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">Status mix</h2>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={58} outerRadius={88} paddingAngle={3} stroke="none">
                  {donutData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ background: d.color }} /> {d.name}
                </span>
                <span className="font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">Workload distribution</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={64} fontSize={12} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 16, border: "1px solid var(--border)" }} />
                <Bar dataKey="value" radius={12}>
                  {workloadData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">Project health</h2>
          <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {projects.slice(0, 6).map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2 text-center">
                <ProgressRing value={p.progress} color={p.accent} size={72} />
                <p className="line-clamp-2 text-xs font-semibold">{p.name}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="surface-card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-lg font-bold">Weekly digest</h2>
          <p className="text-sm text-muted-foreground">
            Export this report as PDF or schedule it every Monday at 9:00.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export PDF</Button>
          <Button variant="hero">Schedule digest</Button>
        </div>
      </section>

      <div className="hidden">{weeklyData.length}</div>
    </div>
  );
}
