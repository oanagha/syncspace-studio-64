import { apiGet, apiPut } from "@/lib/api";

export const THEMES = ["light", "dark", "system"] as const;
export const LANGUAGES = ["en", "es", "fr", "de", "pt"] as const;
export const SIDEBARS = ["expanded", "collapsed"] as const;

export type ThemePreference = (typeof THEMES)[number];
export type LanguagePreference = (typeof LANGUAGES)[number];
export type SidebarPreference = (typeof SIDEBARS)[number];

export type UserPreferences = {
  theme: ThemePreference;
  language: LanguagePreference;
  notifications: boolean;
  sidebar: SidebarPreference;
};

export type PreferencesPatch = {
  theme?: ThemePreference;
  language?: LanguagePreference;
  notifications?: boolean;
  sidebar?: SidebarPreference;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  language: "en",
  notifications: true,
  sidebar: "expanded",
};

export const LANGUAGE_LABELS: Record<LanguagePreference, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
};

export function preferencesQueryKey() {
  return ["settings-preferences"] as const;
}

export async function getPreferences() {
  return apiGet<{ preferences: UserPreferences }>("/api/settings/preferences");
}

export async function updatePreferences(input: PreferencesPatch) {
  return apiPut<{ preferences: UserPreferences }>("/api/settings/preferences", input);
}
