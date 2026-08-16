import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/useWorkspace";
import { PREFERENCES_STORAGE_KEY } from "@/lib/appearance-boot";
import { updateStoredUser } from "@/lib/auth";
import {
  ACCENTS,
  DEFAULT_PREFERENCES,
  DENSITIES,
  LANGUAGES,
  SIDEBARS,
  THEMES,
  applyAccent,
  applyDensity,
  applyReduceMotion,
  getPreferences,
  preferencesQueryKey,
  updatePreferences as updatePreferencesRequest,
  type AccentPreference,
  type DensityPreference,
  type LanguagePreference,
  type PreferencesPatch,
  type ThemePreference,
  type UserPreferences,
} from "@/services/settings.service";

const STORAGE_KEY = PREFERENCES_STORAGE_KEY;

type PreferencesContextValue = {
  preferences: UserPreferences;
  loading: boolean;
  saving: boolean;
  updatePreferences: (patch: PreferencesPatch) => Promise<UserPreferences>;
  replacePreferences: (next: UserPreferences) => UserPreferences;
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

function isDensity(value: unknown): value is DensityPreference {
  return typeof value === "string" && (DENSITIES as readonly string[]).includes(value);
}

function isAccent(value: unknown): value is AccentPreference {
  return typeof value === "string" && (ACCENTS as readonly string[]).includes(value);
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function asWorkspaceId(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function parsePreferences(value: unknown): UserPreferences | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<UserPreferences>;
  return {
    ...DEFAULT_PREFERENCES,
    theme: isTheme(raw.theme) ? raw.theme : DEFAULT_PREFERENCES.theme,
    language: isLanguage(raw.language) ? raw.language : DEFAULT_PREFERENCES.language,
    notifications: asBoolean(raw.notifications, DEFAULT_PREFERENCES.notifications),
    sidebar: isSidebar(raw.sidebar) ? raw.sidebar : DEFAULT_PREFERENCES.sidebar,
    density: isDensity(raw.density) ? raw.density : DEFAULT_PREFERENCES.density,
    accent: isAccent(raw.accent) ? raw.accent : DEFAULT_PREFERENCES.accent,
    reduceMotion: asBoolean(raw.reduceMotion, DEFAULT_PREFERENCES.reduceMotion),
    notifyMentions: asBoolean(raw.notifyMentions, DEFAULT_PREFERENCES.notifyMentions),
    notifyAssignments: asBoolean(raw.notifyAssignments, DEFAULT_PREFERENCES.notifyAssignments),
    notifyDueDates: asBoolean(raw.notifyDueDates, DEFAULT_PREFERENCES.notifyDueDates),
    notifyFiles: asBoolean(raw.notifyFiles, DEFAULT_PREFERENCES.notifyFiles),
    notifyDigest: asBoolean(raw.notifyDigest, DEFAULT_PREFERENCES.notifyDigest),
    twoFactor: asBoolean(raw.twoFactor, DEFAULT_PREFERENCES.twoFactor),
    loginAlerts: asBoolean(raw.loginAlerts, DEFAULT_PREFERENCES.loginAlerts),
    slack: asBoolean(raw.slack, DEFAULT_PREFERENCES.slack),
    github: asBoolean(raw.github, DEFAULT_PREFERENCES.github),
    figma: asBoolean(raw.figma, DEFAULT_PREFERENCES.figma),
    googleDrive: asBoolean(raw.googleDrive, DEFAULT_PREFERENCES.googleDrive),
    fullName: asString(raw.fullName, DEFAULT_PREFERENCES.fullName),
    email: asString(raw.email, DEFAULT_PREFERENCES.email),
    jobTitle: asString(raw.jobTitle, DEFAULT_PREFERENCES.jobTitle),
    timezone: asString(raw.timezone, DEFAULT_PREFERENCES.timezone),
    bio: asString(raw.bio, DEFAULT_PREFERENCES.bio),
    avatarUrl: typeof raw.avatarUrl === "string" && raw.avatarUrl.trim() ? raw.avatarUrl : null,
    workspaceId: asWorkspaceId(raw.workspaceId),
    workspaceName: asString(raw.workspaceName, DEFAULT_PREFERENCES.workspaceName),
    guestAccess: asBoolean(raw.guestAccess, DEFAULT_PREFERENCES.guestAccess),
    require2fa: asBoolean(raw.require2fa, DEFAULT_PREFERENCES.require2fa),
    publicTemplates: asBoolean(raw.publicTemplates, DEFAULT_PREFERENCES.publicTemplates),
  };
}

function normalizePreferences(
  value: unknown,
  fallback: UserPreferences = DEFAULT_PREFERENCES,
): UserPreferences {
  return (
    parsePreferences({ ...fallback, ...(value && typeof value === "object" ? value : {}) }) ??
    fallback
  );
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

function applyAppearance(preferences: UserPreferences) {
  applyTheme(preferences.theme);
  applyLanguage(preferences.language);
  applyAccent(preferences.accent);
  applyDensity("comfortable");
  applyReduceMotion(true);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const cacheHydrated = useRef(false);

  useLayoutEffect(() => {
    if (!cacheHydrated.current) {
      cacheHydrated.current = true;
      const cached = readCachedPreferences();
      if (cached) {
        setPreferences(cached);
        applyAppearance(cached);
        return;
      }
    }
    applyAppearance(preferences);
  }, [preferences]);

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
        const { preferences: next, user } = await getPreferences(workspaceId);
        if (cancelled) return;
        const merged = normalizePreferences(next, preferences);
        setPreferences(merged);
        cachePreferences(merged);
        queryClient.setQueryData(preferencesQueryKey(workspaceId), { preferences: merged });
        if (user) {
          updateStoredUser({
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          });
        } else if (merged.avatarUrl !== undefined) {
          updateStoredUser({ avatarUrl: merged.avatarUrl });
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Reload when the active workspace changes so workspace settings stay in sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, workspaceId]);

  const updatePreferences = useCallback(
    async (patch: PreferencesPatch) => {
      setSaving(true);
      try {
        const { preferences: next, user } = await updatePreferencesRequest({
          ...patch,
          ...(workspaceId && patch.workspaceId === undefined ? { workspaceId } : {}),
        });
        const merged = normalizePreferences(next, preferences);
        setPreferences(merged);
        cachePreferences(merged);
        queryClient.setQueryData(preferencesQueryKey(workspaceId), { preferences: merged });
        if (user) {
          updateStoredUser({
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          });
        }
        return merged;
      } finally {
        setSaving(false);
      }
    },
    [queryClient, workspaceId, preferences],
  );

  const replacePreferences = useCallback(
    (next: UserPreferences) => {
      const merged = normalizePreferences(next, preferences);
      setPreferences(merged);
      cachePreferences(merged);
      queryClient.setQueryData(preferencesQueryKey(workspaceId), { preferences: merged });
      updateStoredUser({
        ...(merged.fullName ? { name: merged.fullName } : {}),
        ...(merged.email ? { email: merged.email } : {}),
        avatarUrl: merged.avatarUrl,
      });
      return merged;
    },
    [preferences, queryClient, workspaceId],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      loading,
      saving,
      updatePreferences,
      replacePreferences,
    }),
    [preferences, loading, saving, updatePreferences, replacePreferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
