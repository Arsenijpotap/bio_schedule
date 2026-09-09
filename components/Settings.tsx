"use client";

import { useState } from "react";
import GroupWizard from "@/components/GroupWizard";
import { getStoredTheme, setTheme, THEME_LABELS, type Theme } from "@/lib/theme";
import type { UserSettings } from "@/types";

const THEME_OPTIONS: Theme[] = ["system", "light", "dark"];

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function Checkmark() {
  return (
    <span className="checkmark">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export default function Settings({
  settings,
  onClose,
  onSaved
}: {
  settings: UserSettings;
  onClose: () => void;
  onSaved: (settings: UserSettings) => void;
}) {
  const [screen, setScreen] = useState<"menu" | "group" | "theme" | "about">("menu");
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  function handleTheme(t: Theme) {
    setTheme(t);
    setThemeState(t);
  }

  const subgroupText = settings.subgroup !== "all" ? `${settings.subgroup} подгруппа` : "вся группа";

  const title =
    screen === "menu" ? "Настройки"
    : screen === "group" ? "Группа и подгруппа"
    : screen === "theme" ? "Цветовая тема"
    : "О приложении";

  return (
    <main className="app" id="main">
      <header style={{
        position: "sticky", top: 0, zIndex: 5,
        background: "color-mix(in srgb, var(--tg-bg) 92%, transparent)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--tg-secondary)"
      }}>
        <div className="container" style={{
          display: "flex", alignItems: "center", gap: 12,
          paddingTop: 14, paddingBottom: 14
        }}>
          <button
            className="icon-btn"
            onClick={screen === "menu" ? onClose : () => setScreen("menu")}
            aria-label={screen === "menu" ? "Закрыть настройки" : "Назад"}
            title={screen === "menu" ? "Закрыть" : "Назад"}
          >
            {screen === "menu" ? <CloseIcon /> : <BackIcon />}
          </button>
          <h1 style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: 700, margin: 0 }}>
            {title}
          </h1>
          <span style={{ width: 38, flexShrink: 0 }} aria-hidden="true" />
        </div>
      </header>

      <section className="container">
        {screen === "menu" && (
          <div className="settings-list">
            <button className="settings-row" onClick={() => setScreen("group")}>
              <span className="row-icon acc-lecture"><UsersIcon /></span>
              <span className="row-text">
                Группа и подгруппа
                <span className="row-sub">{settings.course} курс · {settings.groupName} · {subgroupText}</span>
              </span>
              <ChevronRight />
            </button>
            <button className="settings-row" onClick={() => setScreen("theme")}>
              <span className="row-icon acc-lab"><ThemeIcon /></span>
              <span className="row-text">
                Цветовая тема
                <span className="row-sub">{THEME_LABELS[theme]}</span>
              </span>
              <ChevronRight />
            </button>
            <button className="settings-row" onClick={() => setScreen("about")}>
              <span className="row-icon acc-other"><InfoIcon /></span>
              <span className="row-text">
                О приложении
                <span className="row-sub">Версия и источник данных</span>
              </span>
              <ChevronRight />
            </button>
          </div>
        )}

        {screen === "group" && (
          <GroupWizard onSaved={onSaved} />
        )}

        {screen === "theme" && (
          <div className="settings-list">
            {THEME_OPTIONS.map(t => (
              <button
                key={t}
                className="settings-row"
                onClick={() => handleTheme(t)}
                aria-pressed={theme === t}
              >
                <span className="row-text">
                  {THEME_LABELS[t]}
                  {t === "system" && <span className="row-sub">Как в системе</span>}
                  {t === "light" && <span className="row-sub">Всегда светлая</span>}
                  {t === "dark" && <span className="row-sub">Всегда тёмная</span>}
                </span>
                {theme === t && <Checkmark />}
              </button>
            ))}
          </div>
        )}

        {screen === "about" && (
          <div className="card" style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Расписание БГУ</div>
            <div className="hint" style={{ marginTop: 6 }}>Версия 1.0.0</div>
            <div className="hint" style={{ marginTop: 2 }}>Данные: сайт БГУ</div>
          </div>
        )}
      </section>
    </main>
  );
}
