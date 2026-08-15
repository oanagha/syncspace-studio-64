import { apiGet, apiPost } from "@/lib/api";

export type TeamRole = "Admin" | "Member" | "Guest";

export type TeamInvitation = {
  id: number;
  workspace_id: number;
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

export function teamMembersQueryKey(workspaceId: number | null | undefined) {
  return ["team-members", workspaceId ?? null] as const;
}

export async function listMembers(workspaceId: number) {
  return apiGet<{ members: TeamMember[] }>(`/api/team?workspaceId=${workspaceId}`);
}

export async function inviteToWorkspace(input: {
  workspaceId: number;
  email: string;
  role: TeamRole | string;
}) {
  return apiPost<{ invitation: TeamInvitation }>("/api/team/invite", input);
}

export async function listInvitations(workspaceId: number) {
  return apiGet<{ invitations: TeamInvitation[] }>(
    `/api/team/invites?workspaceId=${workspaceId}`,
  );
}
