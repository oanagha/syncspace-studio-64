import { apiDelete, apiGet, apiPut, apiUploadFormData, getApiOrigin } from "@/lib/api";
import { updateStoredUser } from "@/lib/auth";

export const THEMES = ["light", "dark", "system"] as const;
export const LANGUAGES = ["en", "es", "fr", "de", "pt"] as const;
export const SIDEBARS = ["expanded", "collapsed"] as const;
export const DENSITIES = ["comfortable", "compact"] as const;
export const ACCENTS = ["ocean", "teal", "aqua", "emerald", "amber"] as const;

export type ThemePreference = (typeof THEMES)[number];
export type LanguagePreference = (typeof LANGUAGES)[number];
export type SidebarPreference = (typeof SIDEBARS)[number];
export type DensityPreference = (typeof DENSITIES)[number];
export type AccentPreference = (typeof ACCENTS)[number];

export type UserPreferences = {
  theme: ThemePreference;
  language: LanguagePreference;
  notifications: boolean;
  sidebar: SidebarPreference;
  density: DensityPreference;
  accent: AccentPreference;
  reduceMotion: boolean;
  notifyMentions: boolean;
  notifyAssignments: boolean;
  notifyDueDates: boolean;
  notifyFiles: boolean;
  notifyDigest: boolean;
  twoFactor: boolean;
  loginAlerts: boolean;
  slack: boolean;
  github: boolean;
  figma: boolean;
  googleDrive: boolean;
  fullName: string;
  email: string;
  jobTitle: string;
  timezone: string;
  bio: string;
  avatarUrl: string | null;
  workspaceId: number | null;
  workspaceName: string;
  guestAccess: boolean;
  require2fa: boolean;
  publicTemplates: boolean;
};

export type PreferencesPatch = Partial<UserPreferences> & {
  currentPassword?: string;
  newPassword?: string;
};

export type SettingsUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  language: "en",
  notifications: true,
  sidebar: "expanded",
  density: "comfortable",
  accent: "ocean",
  reduceMotion: true,
  notifyMentions: true,
  notifyAssignments: true,
  notifyDueDates: true,
  notifyFiles: false,
  notifyDigest: true,
  twoFactor: false,
  loginAlerts: true,
  slack: true,
  github: true,
  figma: false,
  googleDrive: false,
  fullName: "",
  email: "",
  jobTitle: "",
  timezone: "",
  bio: "",
  avatarUrl: null,
  workspaceId: null,
  workspaceName: "",
  guestAccess: true,
  require2fa: false,
  publicTemplates: true,
};

export const LANGUAGE_LABELS: Record<LanguagePreference, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
};

export const ACCENT_THEMES: Record<
  AccentPreference,
  { name: string; hex: string; primary: string; accent: string }
> = {
  ocean: {
    name: "Ocean",
    hex: "#1A4A6E",
    primary: "oklch(0.42 0.078 240)",
    accent: "oklch(0.746 0.069 187)",
  },
  teal: {
    name: "Teal",
    hex: "#2D8A9E",
    primary: "oklch(0.55 0.085 215)",
    accent: "oklch(0.76 0.075 195)",
  },
  aqua: {
    name: "Aqua",
    hex: "#5CBDB9",
    primary: "oklch(0.63 0.075 190)",
    accent: "oklch(0.8 0.07 185)",
  },
  emerald: {
    name: "Emerald",
    hex: "#2F9E7D",
    primary: "oklch(0.58 0.095 168)",
    accent: "oklch(0.76 0.08 165)",
  },
  amber: {
    name: "Amber",
    hex: "#D9A441",
    primary: "oklch(0.62 0.12 82)",
    accent: "oklch(0.8 0.1 88)",
  },
};

export function preferencesQueryKey(workspaceId?: number | null) {
  return ["settings-preferences", workspaceId ?? null] as const;
}

export async function getPreferences(workspaceId?: number | null) {
  const query = workspaceId ? `?workspaceId=${workspaceId}` : "";
  return apiGet<{ preferences: UserPreferences; user?: SettingsUser }>(
    `/api/settings/preferences${query}`,
  );
}

export async function updatePreferences(input: PreferencesPatch) {
  return apiPut<{ preferences: UserPreferences; user?: SettingsUser }>(
    "/api/settings/preferences",
    input,
  );
}

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_MIME.has(file.type)) {
    return "Avatar must be a PNG, JPEG, or WebP image";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "Avatar must be 2 MB or smaller";
  }
  return null;
}

export function resolveAvatarUrl(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;
  const origin = getApiOrigin();
  const path = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
  return `${origin}${path}`;
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);
  const result = await apiUploadFormData<{
    message: string;
    preferences: UserPreferences;
    user: SettingsUser;
  }>("/api/settings/avatar", formData);

  if (result.user) {
    updateStoredUser({
      name: result.user.name,
      email: result.user.email,
      avatarUrl: result.user.avatarUrl,
    });
  }

  return result;
}

export async function removeAvatar() {
  const result = await apiDelete<{
    message: string;
    preferences: UserPreferences;
    user: SettingsUser;
  }>("/api/settings/avatar");

  if (result.user) {
    updateStoredUser({
      name: result.user.name,
      email: result.user.email,
      avatarUrl: result.user.avatarUrl,
    });
  }

  return result;
}

export function applyAccent(accent: AccentPreference) {
  if (typeof document === "undefined") return;
  const theme = ACCENT_THEMES[accent];
  if (!theme) return;
  const root = document.documentElement;
  root.dataset.accent = accent;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--ring", theme.primary);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--chart-1", theme.primary);
  root.style.setProperty("--sidebar-primary", theme.primary);
  root.style.setProperty(
    "--gradient-brand",
    `linear-gradient(120deg, color-mix(in oklab, ${theme.primary} 78%, black), ${theme.primary} 45%, ${theme.accent})`,
  );
}

export function applyDensity(density: DensityPreference) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset["density"] = density;
}

export function applyReduceMotion(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("reduce-motion", enabled);
}
