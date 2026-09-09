"use client";

import { useEffect, useState } from "react";
import { getTelegramInitData } from "@/components/TelegramInit";
import type { Subgroup, UserSettings } from "@/types";

type GroupOption = { id: number; number: string; name: string };

function formatLastUpdate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${d.getFullYear()} в ${hours}:${minutes}`;
}

export default function SetupForm({ onSaved }: { onSaved: (settings: UserSettings) => void }) {
  const [course, setCourse] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupOption | null>(null);
  const [subgroups, setSubgroups] = useState<string[]>([]);
  const [subgroupsLoading, setSubgroupsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const init = await getTelegramInitData();
        const res = await fetch("/api/status", {
          headers: {
            "x-telegram-init-data": init,
            "Authorization": init ? `tma ${init}` : ""
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        setLastUpdate(data.lastUpdated ?? null);
      } catch {
        // не критично для настроек
      }
    })();
  }, []);

  async function selectCourse(value: number) {
    setCourse(value);
    setSelectedGroup(null);
    setSubgroups([]);
    setGroupsLoading(true);
    setError("");

    try {
      const init = await getTelegramInitData();
      const res = await fetch(`/api/groups?course=${value}`, {
        headers: {
          "x-telegram-init-data": init,
          "Authorization": init ? `tma ${init}` : ""
        }
      });
      const data = await res.json();
      setGroups(data.groups ?? []);
    } catch {
      setError("Не удалось загрузить группы.");
    } finally {
      setGroupsLoading(false);
    }
  }

  async function selectGroup(group: GroupOption) {
    setSelectedGroup(group);
    setSubgroups([]);
    setSubgroupsLoading(true);
    setError("");

    try {
      const init = await getTelegramInitData();
      const res = await fetch(`/api/subgroups?course=${course}&group=${group.number}`, {
        headers: {
          "x-telegram-init-data": init,
          "Authorization": init ? `tma ${init}` : ""
        }
      });
      const data = await res.json();
      setSubgroups(data.subgroups ?? []);
    } catch {
      setError("Не удалось загрузить подгруппы.");
    } finally {
      setSubgroupsLoading(false);
    }
  }

  async function selectSubgroup(value: Subgroup) {
    if (course === null || !selectedGroup) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": await getTelegramInitData()
        },
        body: JSON.stringify({
          course,
          groupName: selectedGroup.number,
          subgroup: value
        })
      });

      if (!res.ok) {
        setError("Не удалось сохранить настройки.");
        setSaving(false);
        return;
      }

      onSaved({
        course,
        groupName: selectedGroup.number,
        subgroup: value
      });
    } catch {
      setError("Не удалось сохранить настройки.");
      setSaving(false);
    }
  }

  const step = course === null ? "course" : selectedGroup === null ? "group" : "subgroup";

  return (
    <main className="app">
      <div className="container" style={{ paddingTop: 48 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="hint" style={{ fontSize: 14, marginBottom: 8 }}>
            БГУ · расписание
          </div>
          <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: 0 }}>
            {step === "course" && "Выбери курс"}
            {step === "group" && "Выбери группу"}
            {step === "subgroup" && "Выбери подгруппу"}
          </h1>
          <p className="hint" style={{ lineHeight: 1.5 }}>
            {step === "course" && "Укажи курс, чтобы подобрать расписание."}
            {step === "group" && "Найдены группы твоего курса."}
            {step === "subgroup" && "Уточни подгруппу — расписание подстроится под неё."}
          </p>
        </div>

        {step !== "course" && (
          <div className="hint" style={{ marginBottom: 14, fontSize: 13 }}>
            {course} курс
            {selectedGroup ? ` · группа ${selectedGroup.number}` : ""}
          </div>
        )}

        {step === "course" && (
          <div className="card" style={{ display: "grid", gap: 10 }}>
            {[1, 2, 3, 4, 5, 6].map(x => (
              <button key={x} className="primary" onClick={() => selectCourse(x)}>
                {x} курс
              </button>
            ))}
          </div>
        )}

        {step === "group" && (
          <div className="card" style={{ display: "grid", gap: 10 }}>
            {groupsLoading && <div className="hint" style={{ padding: 16, textAlign: "center" }}>Загружаем группы…</div>}
            {!groupsLoading && groups.length === 0 && !error && (
              <div className="hint" style={{ padding: 16, textAlign: "center" }}>Группы не найдены.</div>
            )}
            {!groupsLoading && groups.map(group => (
              <button key={group.id} className="primary" onClick={() => selectGroup(group)}>
                {group.number}
              </button>
            ))}
            <button className="secondary" onClick={() => setCourse(null)}>← Назад</button>
          </div>
        )}

        {step === "subgroup" && (
          <div className="card" style={{ display: "grid", gap: 10 }}>
            {subgroupsLoading && <div className="hint" style={{ padding: 16, textAlign: "center" }}>Загружаем подгруппы…</div>}
            {!subgroupsLoading && !saving && (
              <>
                <button className="primary" onClick={() => selectSubgroup("all")}>
                  Вся группа
                </button>
                {subgroups.map(sub => (
                  <button key={sub} className="primary" onClick={() => selectSubgroup(sub as Subgroup)}>
                    {sub} подгруппа
                  </button>
                ))}
                <button className="secondary" onClick={() => { setSelectedGroup(null); setSubgroups([]); }}>
                  ← Назад
                </button>
              </>
            )}
            {saving && <div className="hint" style={{ padding: 16, textAlign: "center" }}>Сохраняем…</div>}
          </div>
        )}

        {error && <div style={{ color: "#ef4444", marginTop: 14 }}>{error}</div>}

        {lastUpdate && (
          <div className="hint" style={{ marginTop: 24, textAlign: "center", fontSize: 12 }}>
            Последнее обновление расписания: {formatLastUpdate(lastUpdate)}
          </div>
        )}
      </div>
    </main>
  );
}