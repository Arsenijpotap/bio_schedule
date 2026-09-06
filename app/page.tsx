"use client";

import { useEffect, useState } from "react";
import TelegramInit, { getTelegramInitData } from "@/components/TelegramInit";
import SetupForm from "@/components/SetupForm";
import Schedule from "@/components/Schedule";
import type { UserSettings } from "@/types";

export default function Home() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [mode, setMode] = useState<"loading" | "setup" | "schedule">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setError("");

      try {
        const initData = await getTelegramInitData();
        const res = await fetch("/api/auth", {
          headers: {
            "x-telegram-init-data": initData,
            "Authorization": initData ? `tma ${initData}` : ""
          },
          cache: "no-store"
        });

        if (res.status === 401) {
          const data = await res.json().catch(() => null);
          setError(
            data?.error?.includes("BOT_TOKEN")
              ? "Сервер не настроен (BOT_TOKEN). Открой приложение через Telegram и проверь настройки."
              : "Открой приложение через Telegram."
          );
          setMode("setup");
        } else {
          const data = await res.json();
          if (data.user) {
            setSettings({
              course: data.user.course,
              groupName: data.user.groupName,
              subgroup: data.user.subgroup
            });
            setMode("schedule");
          } else {
            setMode("setup");
          }
        }
      } catch {
        setError("Не удалось подключиться к серверу.");
        setMode("setup");
      }
    })();
  }, []);

  function onSaved(saved: UserSettings) {
    setSettings(saved);
    setMode("schedule");
  }

  return (
    <>
      <TelegramInit />

      {mode === "loading" && (
        <main className="app">
          <div className="container" style={{ paddingTop: 160, textAlign: "center" }}>
            <div className="spinner" />
            <div className="hint" style={{ marginTop: 14 }}>Загружаем…</div>
          </div>
        </main>
      )}

      {mode === "schedule" && settings && (
        <Schedule settings={settings} onChange={() => setMode("setup")} />
      )}

      {mode === "setup" && (error
        ? (
          <main className="app">
            <div className="container" style={{ paddingTop: 100 }}>
              <div className="card" style={{ textAlign: "center" }}>
                <b>{error}</b>
              </div>
            </div>
          </main>
        )
        : <SetupForm onSaved={onSaved} />
      )}
    </>
  );
}