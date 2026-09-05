"use client";

import { useEffect, useState } from "react";
import type { Subgroup } from "@/types";

function initData() {
  return window.Telegram?.WebApp?.initData ?? "";
}

export default function SetupForm({ onSaved }: { onSaved: () => void }) {
  const [course, setCourse] = useState("1");
  const [groupName, setGroupName] = useState("");
  const [subgroup, setSubgroup] = useState<Subgroup>("all");
  const [groups, setGroups] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGroups() {
      setLoadingGroups(true);
      try {
        const weekDate = monday(new Date());
        const res = await fetch(`/api/groups?course=${course}&week_date=${weekDate}`, {
          headers: { "x-telegram-init-data": initData() }
        });
        const data = await res.json();
        setGroups(data.groups ?? []);
      } finally {
        setLoadingGroups(false);
      }
    }
    loadGroups();
  }, [course]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-init-data": initData()
      },
      body: JSON.stringify({ course, groupName, subgroup })
    });

    if (!res.ok) {
      setError("Не удалось сохранить настройки.");
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <main className="app">
      <div className="container" style={{ paddingTop: 48 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="hint" style={{ fontSize: 14, marginBottom: 8 }}>
            БГУ · расписание
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: 0 }}>
            Настроим расписание
          </h1>
          <p className="hint" style={{ lineHeight: 1.5 }}>
            Выбери курс, группу и подгруппу. Настройки сохранятся в базе
            и больше не потребуют повторного ввода.
          </p>
        </div>

        <form onSubmit={submit} className="card" style={{ display: "grid", gap: 18 }}>
          <label>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Курс</div>
            <select className="select" value={course} onChange={e => setCourse(e.target.value)}>
              {[1,2,3,4,5,6].map(x => <option key={x} value={x}>{x} курс</option>)}
            </select>
          </label>

          <label>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Группа</div>
            {groups.length > 0 ? (
              <select className="select" value={groupName} onChange={e => setGroupName(e.target.value)}>
                <option value="">Выберите группу</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <input
                className="input"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder={loadingGroups ? "Загружаем группы…" : "Например: 1"}
              />
            )}
          </label>

          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Подгруппа</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {(["all","1","2"] as Subgroup[]).map(x => (
                <button
                  type="button"
                  key={x}
                  className={x === subgroup ? "primary" : "secondary"}
                  onClick={() => setSubgroup(x)}
                >
                  {x === "all" ? "Все" : `${x} подгруппа`}
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: "#ef4444" }}>{error}</div>}

          <button className="primary" disabled={saving || !groupName}>
            {saving ? "Сохраняем…" : "Показать расписание"}
          </button>
        </form>
      </div>
    </main>
  );
}

function monday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}