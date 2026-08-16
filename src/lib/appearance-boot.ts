import { ACCENT_THEMES } from "@/services/settings.service";

export const PREFERENCES_STORAGE_KEY = "syncspace.preferences";

const accentVars = Object.fromEntries(
  Object.entries(ACCENT_THEMES).map(([key, theme]) => [
    key,
    { primary: theme.primary, accent: theme.accent },
  ]),
);

export const appearanceBootScript = `(function(){
  try {
    var raw = localStorage.getItem(${JSON.stringify(PREFERENCES_STORAGE_KEY)});
    if (!raw) return;
    var prefs = JSON.parse(raw);
    var themes = ${JSON.stringify(accentVars)};
    var accent = themes[prefs && prefs.accent];
    var root = document.documentElement;
    if (accent) {
      root.dataset.accent = prefs.accent;
      root.style.setProperty("--primary", accent.primary);
      root.style.setProperty("--ring", accent.primary);
      root.style.setProperty("--accent", accent.accent);
      root.style.setProperty("--chart-1", accent.primary);
      root.style.setProperty("--sidebar-primary", accent.primary);
      root.style.setProperty(
        "--gradient-brand",
        "linear-gradient(120deg, color-mix(in oklab, " + accent.primary + " 78%, black), " + accent.primary + " 45%, " + accent.accent + ")"
      );
    }
    var theme = prefs && prefs.theme;
    var dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", !!dark);
  } catch (e) {}
})();`;
