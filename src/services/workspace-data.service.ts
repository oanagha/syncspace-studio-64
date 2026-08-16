import type { QueryClient } from "@tanstack/react-query";

/**
 * Prefixes that match real query keys used across the app.
 * Keep these aligned with projectQueryKey, filesQueryKey, analyticsQueryKey,
 * teamMembersQueryKey, invitationQueryKey, notificationQueryKey, etc.
 */
export const workspaceQueryKeys = {
  projects: (workspaceId: number) => ["projects", workspaceId] as const,
  files: (workspaceId: number) => ["files", workspaceId] as const,
  analytics: (workspaceId: number) => ["analytics", workspaceId] as const,
  teamMembers: (workspaceId: number) => ["team-members", workspaceId] as const,
  teamInvites: (workspaceId: number) => ["team-invites", workspaceId] as const,
  team: (workspaceId: number) => ["team", workspaceId] as const,
};

/**
 * Drop cached data for a workspace that no longer exists.
 */
export async function clearDeletedWorkspaceData(workspaceId: number, queryClient?: QueryClient) {
  if (!queryClient) return;

  await Promise.all([
    queryClient.removeQueries({ queryKey: workspaceQueryKeys.projects(workspaceId) }),
    queryClient.removeQueries({ queryKey: workspaceQueryKeys.files(workspaceId) }),
    queryClient.removeQueries({ queryKey: workspaceQueryKeys.analytics(workspaceId) }),
    queryClient.removeQueries({ queryKey: workspaceQueryKeys.teamMembers(workspaceId) }),
    queryClient.removeQueries({ queryKey: workspaceQueryKeys.teamInvites(workspaceId) }),
    queryClient.removeQueries({ queryKey: workspaceQueryKeys.team(workspaceId) }),
    queryClient.invalidateQueries({ queryKey: ["team-invites", "mine"] }),
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    queryClient.invalidateQueries({ queryKey: ["settings-preferences"] }),
  ]);
}

/**
 * Invalidate all workspace-scoped caches after switch/create.
 * Also refreshes user-level notifications and preferences.
 */
export async function refetchWorkspaceScopedData(workspaceId: number, queryClient?: QueryClient) {
  if (!queryClient) return;

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.projects(workspaceId) }),
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.files(workspaceId) }),
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.analytics(workspaceId) }),
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.teamMembers(workspaceId) }),
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.teamInvites(workspaceId) }),
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.team(workspaceId) }),
    queryClient.invalidateQueries({ queryKey: ["team-invites", "mine"] }),
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    queryClient.invalidateQueries({ queryKey: ["settings-preferences"] }),
    // Project-scoped boards/tasks for previous workspace stay in cache by project id;
    // active UI remounts via WorkspaceContext key on pathname+workspace.
  ]);
}
