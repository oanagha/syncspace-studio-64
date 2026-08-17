import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

export type WorkspaceRole = "Owner" | "Admin" | "Member" | string;

export type Workspace = {
  id: number;
  name: string;
  role: WorkspaceRole;
  created_at?: string;
  updated_at?: string;
};

export type ActiveWorkspace = {
  id: number;
  name: string;
  role: WorkspaceRole;
};

export function canRenameWorkspace(role?: WorkspaceRole | null) {
  return role === "Owner" || role === "Admin";
}

export function canEditWorkspaceContent(role?: WorkspaceRole | null) {
  return role === "Owner" || role === "Admin" || role === "Member";
}

export function canDeleteWorkspace(role?: WorkspaceRole | null) {
  return role === "Owner";
}

export function workspaceInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function listWorkspaces() {
  return apiGet<{ workspaces: Workspace[] }>("/api/workspaces");
}

export async function getWorkspace(id: number) {
  return apiGet<{ workspace: Workspace }>(`/api/workspaces/${id}`);
}

export async function createWorkspace(name: string) {
  return apiPost<{ workspace: Workspace }>("/api/workspaces", { name });
}

export async function switchWorkspace(workspaceId: number) {
  return apiPost<{ active_workspace: ActiveWorkspace }>("/api/workspaces/switch", {
    workspace_id: workspaceId,
  });
}

export async function renameWorkspace(id: number, name: string) {
  return apiPut<{ workspace: Workspace }>(`/api/workspaces/${id}`, { name });
}

export async function deleteWorkspace(id: number) {
  return apiDelete<{ message: string }>(`/api/workspaces/${id}`);
}
