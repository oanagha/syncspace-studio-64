const TOKEN_KEY = "token";
const USER_KEY = "user";
const ACTIVE_WORKSPACE_KEY = "activeWorkspace";
const LEGACY_ACTIVE_WORKSPACE_KEY = "activeWorkspaceId";

export type StoredActiveWorkspace = {
  id: number;
  name: string;
  role: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type RegisterResponse = {
  message: string;
  token: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    workspace_email: string;
    workspace_name: string;
  };
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function updateStoredUser(patch: Partial<AuthUser>) {
  const current = getUser();
  if (!current) return;
  localStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...patch }));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
  localStorage.removeItem(LEGACY_ACTIVE_WORKSPACE_KEY);
}

export function getStoredActiveWorkspace(): StoredActiveWorkspace | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as StoredActiveWorkspace;
      if (
        parsed &&
        typeof parsed.id === "number" &&
        Number.isInteger(parsed.id) &&
        parsed.id > 0 &&
        typeof parsed.name === "string" &&
        typeof parsed.role === "string"
      ) {
        return parsed;
      }
    } catch {
      // Fall through to the legacy id-only key.
    }
  }

  const legacyId = Number(localStorage.getItem(LEGACY_ACTIVE_WORKSPACE_KEY));
  if (Number.isInteger(legacyId) && legacyId > 0) {
    return { id: legacyId, name: "", role: "" };
  }

  return null;
}

export function saveActiveWorkspace(workspace: StoredActiveWorkspace | null) {
  if (typeof window === "undefined") return;

  localStorage.removeItem(LEGACY_ACTIVE_WORKSPACE_KEY);

  if (!workspace) {
    localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    return;
  }

  localStorage.setItem(
    ACTIVE_WORKSPACE_KEY,
    JSON.stringify({
      id: workspace.id,
      name: workspace.name,
      role: workspace.role,
    }),
  );
}
