"use client";

import { useEffect, useState } from "react";
import TelegramInit from "@/components/TelegramInit";
import SetupForm from "@/components/SetupForm";
import Schedule from "@/components/Schedule";
import type { UserSettings } from "@/types";

export default function Home() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [error, setError] = useState("");

  async function loadUser() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        headers: {
          "x-telegram-init-data": window.Telegram?.WebApp?.initData ?? ""
        }
      });

      if (res.status === 401) {
        setError("Открой приложение через Telegram.");
        return;
      }

      const data = await res.json();

      if (!data.user) {
        setSetupRequired(true);
      } else {
        setSettings({
          course: data.user.course,
          groupName: data.user.groupName,
          subgroup: data.user.subgroup
        });
      }
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUser(); }, []);

  return (
    <>
      <TelegramInit />

      {loading && (
        <main className="app">
          <div className="container" style={{ paddingTop: 100, textAlign: "center" }}>
            Загрузка…
          </div>
        </main>
      )}

      {!loading && error && (
        <main className="app">
          <div className="container" style={{ paddingTop: 100 }}>
            <div className="card" style={{ textAlign: "center" }}>
              <b>{error}</b>
            </div>
          </div>
        </main>
      )}

      {!loading && !error && setupRequired && (
        <SetupForm onSaved={loadUser} />
      )}

      {!loading && !error && settings && (
        <Schedule settings={settings} onChange={() => {
          setSettings(null);
          setSetupRequired(true);
        }} />
      )}
    </>
  );
}