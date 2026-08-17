import { apiDelete, apiGet } from "@/lib/api";

export type AuthSession = {
  id: string;
  current: boolean;
  label: string;
  ip?: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

export function sessionsQueryKey() {
  return ["auth-sessions"] as const;
}

export async function listSessions(): Promise<AuthSession[]> {
  const data = await apiGet<{ sessions: AuthSession[] }>("/api/auth/sessions");
  return data.sessions ?? [];
}

export async function revokeSession(sessionId: string) {
  return apiDelete<{ message: string; current: boolean }>(`/api/auth/sessions/${sessionId}`);
}
