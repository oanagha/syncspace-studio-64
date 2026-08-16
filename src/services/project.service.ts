import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

export type ProjectStatus = "On Track" | "At Risk" | "Completed";
export type ProjectSort = "progress" | "name" | "deadline" | "recent";

export type ProjectMember = {
  id: number;
  name: string;
  avatar: string | null;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  color: string;
  status: ProjectStatus | string;
  progress: number;
  completed_tasks: number;
  total_tasks: number;
  deadline: string | null;
  member_count: number;
  members: ProjectMember[];
  created_at?: string;
  updated_at?: string;
  workspace_id?: number;
  role?: string;
};

export type ProjectFilters = {
  workspaceId: number;
  search?: string;
  status?: string;
  sort?: ProjectSort | string;
};

export type CreateProjectInput = {
  workspaceId: number;
  title: string;
  description?: string;
  color?: string;
  deadline?: string;
};

export type UpdateProjectInput = {
  title: string;
  description?: string;
  color?: string;
  status?: ProjectStatus | string;
  deadline?: string | null;
};

export const PROJECT_STATUSES: Array<"all" | ProjectStatus> = [
  "all",
  "On Track",
  "At Risk",
  "Completed",
];

export const PROJECT_SORTS: ProjectSort[] = ["progress", "name", "deadline", "recent"];

export const PROJECT_STATUS_STYLES: Record<string, { badge: string; stroke: string }> = {
  "On Track": { badge: "bg-teal-100 text-teal-800", stroke: "#14B8A6" },
  "At Risk": { badge: "bg-orange-100 text-orange-800", stroke: "#F97316" },
  Completed: { badge: "bg-emerald-100 text-emerald-800", stroke: "#22C55E" },
};

export const PROJECT_COLORS = [
  "#14B8A6",
  "#4FD1C5",
  "#1A4A6E",
  "#2D8A9E",
  "#5CBDB9",
  "#2F9E7D",
  "#D9A441",
  "#E07A5F",
];

const AVATAR_COLORS = ["#1A4A6E", "#2D8A9E", "#5CBDB9", "#2F9E7D", "#D9A441", "#E07A5F"];

export function projectQueryKey(
  workspaceId: number | null | undefined,
  search = "",
  status = "all",
  sort: string = "progress",
) {
  return ["projects", workspaceId ?? null, search, status, sort] as const;
}

export function projectDetailQueryKey(projectId: number | string) {
  return ["project", Number(projectId)] as const;
}

export function canEditProject(role?: string | null) {
  return role === "Owner" || role === "Admin";
}

export function memberInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function memberAvatarColor(id: number) {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length]!;
}

export function formatProjectDeadline(deadline: string | null) {
  if (!deadline) return "No due date";
  const date = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(date.getTime())) return deadline;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatProjectTimestamp(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function listProjects(filters: ProjectFilters) {
  const params = new URLSearchParams();
  params.set("workspaceId", String(filters.workspaceId));

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.sort) {
    params.set("sort", filters.sort);
  }

  return apiGet<{ projects: Project[] }>(`/api/projects?${params.toString()}`);
}

export async function getProject(id: number) {
  return apiGet<{ project: Project }>(`/api/projects/${id}`);
}

export async function createProject(input: CreateProjectInput) {
  return apiPost<{ project: Pick<Project, "id" | "title" | "status" | "progress"> }>(
    "/api/projects",
    input,
  );
}

export async function updateProject(id: number, input: UpdateProjectInput) {
  return apiPut<{ project: Project }>(`/api/projects/${id}`, input);
}

export async function deleteProject(id: number) {
  return apiDelete<{ message: string }>(`/api/projects/${id}`);
}
