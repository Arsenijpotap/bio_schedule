"use client";

import { useState } from "react";
import GroupWizard from "@/components/GroupWizard";
import { getStoredTheme, setTheme, THEME_LABELS, type Theme } from "@/lib/theme";
import type { UserSettings } from "@/types";

const THEME_OPTIONS: Theme[] = ["system", "light", "dark"];

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

  return (
    <main className="app" id="main">
      <div className="container" style={{ paddingTop: 16 }}>
        <header style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {screen !== "menu" && (
              <button className="icon-btn" onClick={() => setScreen("menu")} aria-label="Назад" title="Назад">
                ←
              </button>
            )}
            <h1 style={{ fontSize: 24, margin: 0 }}>
              {screen === "menu" && "Настройки"}
              {screen === "group" && "Группа и подгруппа"}
              {screen === "theme" && "Цветовая тема"}
              {screen === "about" && "О приложении"}
            </h1>
          </div>
        </header>

        {screen === "menu" && (
          <div className="card" style={{ display: "grid", gap: 10 }}>
            <button className="primary" onClick={() => setScreen("group")}>
              Группа и подгруппа
              <span className="hint" style={{ display: "block", fontSize: 12, fontWeight: 500, marginTop: 4 }}>
                {settings.course} курс · {settings.groupName} · {subgroupText}
              </span>
            </button>
            <button className="primary" onClick={() => setScreen("theme")}>
              Цветовая тема
              <span className="hint" style={{ display: "block", fontSize: 12, fontWeight: 500, marginTop: 4 }}>
                {THEME_LABELS[theme]}
              </span>
            </button>
            <button className="primary" onClick={() => setScreen("about")}>
              О приложении
              <span className="hint" style={{ display: "block", fontSize: 12, fontWeight: 500, marginTop: 4 }}>
                Версия и источник данных
              </span>
            </button>
            <button className="secondary" onClick={onClose}>Готово</button>
          </div>
        )}

        {screen === "group" && (
          <GroupWizard onSaved={onSaved} />
        )}

        {screen === "theme" && (
          <div className="card" style={{ display: "grid", gap: 10 }}>
            {THEME_OPTIONS.map(t => (
              <button
                key={t}
                className={theme === t ? "primary" : "secondary"}
                onClick={() => handleTheme(t)}
              >
                {THEME_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {screen === "about" && (
          <div className="card" style={{ display: "grid", gap: 8 }}>
            <b>Расписание БГУ</b>
            <div className="hint">Версия 1.0.0</div>
            <div className="hint">Данные: сайт БГУ</div>
            <button className="secondary" onClick={onClose}>Закрыть</button>
          </div>
        )}
      </div>
    </main>
  );
}
