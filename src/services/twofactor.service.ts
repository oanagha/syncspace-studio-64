import { apiGet, apiPost } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

export type LoginSuccess = {
  token: string;
  user: AuthUser;
  requires2fa?: false;
};

export type LoginRequires2fa = {
  requires2fa: true;
  challengeToken: string;
  message?: string;
};

export type LoginResult = LoginSuccess | LoginRequires2fa;

export type TwoFactorStatus = {
  enabled: boolean;
};

export type TwoFactorSetup = {
  secret: string;
  otpauthUrl: string;
  qrUrl: string;
};

export function isLoginRequires2fa(data: LoginResult): data is LoginRequires2fa {
  return Boolean(data && "requires2fa" in data && data.requires2fa);
}

export async function loginWithPassword(email: string, password: string) {
  return apiPost<LoginResult>("/api/auth/login", { email, password });
}

export async function verifyLogin2fa(challengeToken: string, code: string) {
  return apiPost<LoginSuccess>("/api/auth/verify-2fa", { challengeToken, code });
}

export async function getTwoFactorStatus() {
  return apiGet<TwoFactorStatus>("/api/auth/2fa/status");
}

export async function setupTwoFactor() {
  return apiPost<TwoFactorSetup>("/api/auth/2fa/setup", {});
}

export async function enableTwoFactor(code: string) {
  return apiPost<{ enabled: boolean; message: string }>("/api/auth/2fa/enable", { code });
}

export async function disableTwoFactor(password: string, code: string) {
  return apiPost<{ enabled: boolean; message: string }>("/api/auth/2fa/disable", {
    password,
    code,
  });
}
