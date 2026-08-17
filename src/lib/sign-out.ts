import type { QueryClient } from "@tanstack/react-query";
import { clearAuth } from "@/lib/auth";
import { sessionsQueryKey } from "@/services/session.service";

/** Stop in-flight queries, drop auth-scoped cache, and clear stored credentials. */
export async function signOutClient(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.removeQueries({ queryKey: sessionsQueryKey() });
  clearAuth();
}
