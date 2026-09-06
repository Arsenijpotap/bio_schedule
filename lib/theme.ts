export type Theme = "system" | "light" | "dark";

const THEME_KEY = "bsu.theme";

type Palette = {
  bg: string;
  text: string;
  hint: string;
  secondary: string;
  button: string;
  buttonText: string;
  link: string;
  card: string;
  lecture: string;
  practice: string;
  lab: string;
  other: string;
};

const LIGHT: Palette = {
  bg: "#ffffff",
  text: "#111111",
  hint: "#7d7d83",
  secondary: "#f0f0f2",
  button: "#2aabee",
  buttonText: "#ffffff",
  link: "#2aabee",
  card: "#f6f6f8",
  lecture: "#2481cc",
  practice: "#22a06b",
  lab: "#8b5cf6",
  other: "#6b7680"
};

const DARK: Palette = {
  bg: "#18222d",
  text: "#ffffff",
  hint: "#a5afb9",
  secondary: "#22303d",
  button: "#2aabee",
  buttonText: "#ffffff",
  link: "#64b5ef",
  card: "#202f3d",
  lecture: "#5ea9f2",
  practice: "#3ddc9c",
  lab: "#a78bfa",
  other: "#aab4bd"
};

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(THEME_KEY);
  return value === "light" || value === "dark" ? value : "system";
}

function applyPalette(p: Palette, dark: boolean) {
  const root = document.documentElement;
  root.style.setProperty("--tg-bg", p.bg);
  root.style.setProperty("--tg-text", p.text);
  root.style.setProperty("--tg-hint", p.hint);
  root.style.setProperty("--tg-secondary", p.secondary);
  root.style.setProperty("--tg-button", p.button);
  root.style.setProperty("--tg-button-text", p.buttonText);
  root.style.setProperty("--tg-link", p.link);
  root.style.setProperty("--tg-card", p.card);
  root.style.setProperty("--acc-lecture", p.lecture);
  root.style.setProperty("--acc-practice", p.practice);
  root.style.setProperty("--acc-lab", p.lab);
  root.style.setProperty("--acc-other", p.other);
  root.style.colorScheme = dark ? "dark" : "light";
}

function applyTelegramTheme(): boolean {
  const tp = window.Telegram?.WebApp?.themeParams;
  if (!tp) return false;

  const dark = window.Telegram?.WebApp?.colorScheme === "dark";
  const accent = dark ? DARK : LIGHT;

  applyPalette({
    bg: tp.bg_color ?? accent.bg,
    text: tp.text_color ?? accent.text,
    hint: tp.hint_color ?? accent.hint,
    secondary: tp.secondary_bg_color ?? accent.secondary,
    button: tp.button_color ?? accent.button,
    buttonText: tp.button_text_color ?? accent.buttonText,
    link: tp.link_color ?? accent.link,
    card: tp.secondary_bg_color ?? accent.card,
    lecture: accent.lecture,
    practice: accent.practice,
    lab: accent.lab,
    other: accent.other
  }, dark);

  return true;
}

function systemDark(): boolean {
  if (window.Telegram?.WebApp?.colorScheme === "dark") return true;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  if (theme === "system") {
    if (applyTelegramTheme()) return;
    applyPalette(systemDark() ? DARK : LIGHT, systemDark());
    return;
  }

  applyPalette(theme === "light" ? LIGHT : DARK, theme === "dark");
}

export function setTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export const THEME_LABELS: Record<Theme, string> = {
  system: "Системная",
  light: "Светлая",
  dark: "Тёмная"
};
