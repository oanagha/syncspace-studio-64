const TOKEN_KEY = "token";
const USER_KEY = "user";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
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
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
