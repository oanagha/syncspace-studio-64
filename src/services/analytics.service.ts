import { apiGet } from "@/lib/api";

export const ANALYTICS_RANGES = ["7d", "30d", "quarter", "year"] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export type AnalyticsPerson = {
  id: number;
  name: string;
  initials?: string;
  color?: string;
};

export type AnalyticsDueTask = {
  id: number;
  title: string;
  due: string;
  column?: string;
  assignee: AnalyticsPerson;
};

export type AnalyticsActivity = {
  id: string;
  action: string;
  target: string;
  time: string;
  user: AnalyticsPerson;
};

export type AnalyticsThroughputPoint = {
  day: string;
  week: string;
  created: number;
  completed: number;
  target: number;
};

export type AnalyticsSlice = {
  name: string;
  value: number;
  color: string;
};

export type AnalyticsProjectHealth = {
  id: number;
  name: string;
  progress: number;
  accent: string;
  status: string;
  tasks: number;
  done: number;
  due: string;
};

export type AnalyticsDashboard = {
  user: { id: number; name: string; first_name?: string };
  productivity_score: number;
  due_today: AnalyticsDueTask[];
  activity: AnalyticsActivity[];
  throughput: AnalyticsThroughputPoint[];
  status_breakdown: AnalyticsSlice[];
  workload: AnalyticsSlice[];
  project_health: AnalyticsProjectHealth[];
  kpis: {
    total_tasks: number;
    completion: number;
    velocity: number;
    hours_saved: number;
    reviews_waiting: number;
    due_today_count: number;
  };
  stats: {
    tasks_completed: number;
    avg_cycle_time: number;
    on_time_delivery: number;
    active_collaborators: number;
    tasks_completed_delta: string;
    cycle_time_delta: string;
    on_time_delta: string;
    collaborators_delta: string;
  };
  range: AnalyticsRange | string;
  generated_at: string;
};

export const RANGE_LABELS: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

export function analyticsQueryKey(workspaceId: number | null | undefined, range: string) {
  return ["analytics", workspaceId ?? null, range] as const;
}

export async function getAnalyticsDashboard(
  workspaceId: number,
  range: AnalyticsRange | string = "7d",
) {
  const params = new URLSearchParams({
    workspaceId: String(workspaceId),
    range: String(range),
  });
  return apiGet<AnalyticsDashboard>(`/api/analytics/dashboard?${params.toString()}`);
}

export function greetingForHour(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function systemLabel(score: number) {
  if (score >= 70) return "Optimal";
  if (score >= 40) return "Watch";
  return "At Risk";
}

export function formatUpdatedAt(value?: string) {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
