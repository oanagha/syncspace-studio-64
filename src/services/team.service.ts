import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

export type TeamRole = "Admin" | "Member" | "Guest";
export type MemberRole = "Owner" | "Admin" | "Member" | "Guest";

export type TeamInvitation = {
  id: number;
  workspace_id: number;
  workspace_name?: string | null;
  email: string;
  role: string;
  status: string;
  invited_by: number;
  created_at: string;
};

export type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: string;
  initials: string;
  tasks: number;
  activity: number;
  joined_at?: string;
};

export function invitationQueryKey(workspaceId: number | null | undefined) {
  return ["team-invites", workspaceId ?? null] as const;
}

export function myInvitationsQueryKey() {
  return ["team-invites", "mine"] as const;
}

export function teamMembersQueryKey(workspaceId: number | null | undefined) {
  return ["team-members", workspaceId ?? null] as const;
}

/** Alias used by workspace-scoped invalidation. */
export function teamQueryKey(workspaceId: number | null | undefined) {
  return ["team", workspaceId ?? null] as const;
}

export async function listMembers(workspaceId: number) {
  return apiGet<{ members: TeamMember[] }>(`/api/team?workspaceId=${workspaceId}`);
}

export async function inviteToWorkspace(input: {
  workspaceId: number;
  email: string;
  role: TeamRole | string;
}) {
  return apiPost<{ invitation: TeamInvitation; message?: string; warning?: string }>(
    "/api/team/invite",
    input,
  );
}

export async function listInvitations(workspaceId: number) {
  return apiGet<{ invitations: TeamInvitation[] }>(`/api/team/invites?workspaceId=${workspaceId}`);
}

export async function listMyInvitations() {
  return apiGet<{ invitations: TeamInvitation[] }>("/api/team/invites/mine");
}

export async function updateMemberRole(input: {
  userId: number;
  workspaceId: number;
  role: MemberRole | string;
}) {
  return apiPatch<{ member: TeamMember }>(`/api/team/${input.userId}`, {
    workspaceId: input.workspaceId,
    role: input.role,
  });
}

export async function removeMember(input: { userId: number; workspaceId: number }) {
  return apiDelete<{ message: string }>(`/api/team/${input.userId}`, {
    workspaceId: input.workspaceId,
  });
}

export async function acceptInvitation(invitationId: number) {
  return apiPost<{
    message: string;
    workspace: { id: number; name: string; role: string };
    invitation: { id: number; status: string };
  }>(`/api/team/invites/${invitationId}/accept`, {});
}

export async function cancelInvitation(invitationId: number) {
  return apiDelete<{ message: string }>(`/api/team/invites/${invitationId}`);
}

export function canManageTeam(role?: string | null) {
  return role === "Owner" || role === "Admin";
}
