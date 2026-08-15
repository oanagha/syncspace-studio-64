import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_PREFERENCES,
  LANGUAGES,
  SIDEBARS,
  THEMES,
  getPreferences,
  preferencesQueryKey,
  updatePreferences as updatePreferencesRequest,
  type LanguagePreference,
  type PreferencesPatch,
  type ThemePreference,
  type UserPreferences,
} from "@/services/settings.service";

const STORAGE_KEY = "syncspace.preferences";

type PreferencesContextValue = {
  preferences: UserPreferences;
  loading: boolean;
  saving: boolean;
  updatePreferences: (patch: PreferencesPatch) => Promise<UserPreferences>;
};

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function isTheme(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

function isLanguage(value: unknown): value is LanguagePreference {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

function isSidebar(value: unknown): value is UserPreferences["sidebar"] {
  return typeof value === "string" && (SIDEBARS as readonly string[]).includes(value);
}

function parsePreferences(value: unknown): UserPreferences | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!isTheme(raw.theme) || !isLanguage(raw.language) || !isSidebar(raw.sidebar)) {
    return null;
  }
  if (typeof raw.notifications !== "boolean") return null;
  return {
    theme: raw.theme,
    language: raw.language,
    notifications: raw.notifications,
    sidebar: raw.sidebar,
  };
}

function readCachedPreferences(): UserPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    return parsePreferences(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? ""));
  } catch {
    return null;
  }
}

function cachePreferences(preferences: UserPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function applyLanguage(language: LanguagePreference) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<UserPreferences>(
    () => readCachedPreferences() ?? DEFAULT_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    applyTheme(preferences.theme);
    applyLanguage(preferences.language);
  }, [preferences.theme, preferences.language]);

  useEffect(() => {
    if (preferences.theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preferences.theme]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { preferences: next } = await getPreferences();
        if (cancelled) return;
        setPreferences(next);
        cachePreferences(next);
        queryClient.setQueryData(preferencesQueryKey(), { preferences: next });
      } catch (err) {
        console.error("Failed to load preferences:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const updatePreferences = useCallback(async (patch: PreferencesPatch) => {
    setSaving(true);
    try {
      const { preferences: next } = await updatePreferencesRequest(patch);
      setPreferences(next);
      cachePreferences(next);
      queryClient.setQueryData(preferencesQueryKey(), { preferences: next });
      return next;
    } finally {
      setSaving(false);
    }
  }, [queryClient]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      loading,
      saving,
      updatePreferences,
    }),
    [preferences, loading, saving, updatePreferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
