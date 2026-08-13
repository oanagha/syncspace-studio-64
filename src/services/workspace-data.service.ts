import type { QueryClient } from "@tanstack/react-query";

export const workspaceQueryKeys = {
  projects: (workspaceId: number) => ["projects", workspaceId] as const,
  tasks: (workspaceId: number) => ["tasks", workspaceId] as const,
  files: (workspaceId: number) => ["files", workspaceId] as const,
  members: (workspaceId: number) => ["members", workspaceId] as const,
  notifications: (workspaceId: number) => ["notifications", workspaceId] as const,
  analytics: (workspaceId: number) => ["analytics", workspaceId] as const,
};

/**
 * Workspace-scoped data loaders.
 * Wire each to its API when available:
 * GET /api/projects?workspace_id=
 * GET /api/tasks?workspace_id=
 * GET /api/files?workspace_id=
 * GET /api/team?workspace_id=
 * GET /api/notifications?workspace_id=
 * GET /api/analytics/dashboard?workspace_id=
 */
export async function fetchProjects(_workspaceId: number) {}
export async function fetchTasks(_workspaceId: number) {}
export async function fetchFiles(_workspaceId: number) {}
export async function fetchMembers(_workspaceId: number) {}
export async function fetchNotifications(_workspaceId: number) {}
export async function fetchAnalytics(_workspaceId: number) {}

export async function refetchWorkspaceScopedData(
  workspaceId: number,
  queryClient?: QueryClient,
) {
  await Promise.all([
    fetchProjects(workspaceId),
    fetchTasks(workspaceId),
    fetchFiles(workspaceId),
    fetchMembers(workspaceId),
    fetchNotifications(workspaceId),
    fetchAnalytics(workspaceId),
  ]);

  if (!queryClient) return;

  await Promise.all(
    Object.values(workspaceQueryKeys).map((keyOf) =>
      queryClient.invalidateQueries({ queryKey: keyOf(workspaceId) }),
    ),
  );
}
