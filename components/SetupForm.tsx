"use client";

import { useState } from "react";
import { getTelegramInitData } from "@/components/TelegramInit";
import type { Subgroup, UserSettings } from "@/types";

type GroupOption = { id: number; number: string; name: string };

export default function SetupForm({ onSaved }: { onSaved: (settings: UserSettings) => void }) {
  const [course, setCourse] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupOption | null>(null);
  const [subgroups, setSubgroups] = useState<string[]>([]);
  const [subgroupsLoading, setSubgroupsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const step = course === null ? "course" : selectedGroup === null ? "group" : "subgroup";
  const stepIndex = step === "course" ? 0 : step === "group" ? 1 : 2;

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

  return (
    <main className="app">
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="steps">
          <span className={`step-pill${stepIndex >= 0 ? " fill" : ""}`} />
          <span className={`step-pill${stepIndex >= 1 ? " fill" : ""}`} />
          <span className={`step-pill${stepIndex >= 2 ? " fill" : ""}`} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div className="hint" style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: .6,
            textTransform: "uppercase",
            marginBottom: 8
          }}>
            БГУ · расписание
          </div>
          <h1 style={{ fontSize: 28, lineHeight: 1.15, margin: 0, fontWeight: 800 }}>
            {step === "course" && "Какой курс?"}
            {step === "group" && "Выбери группу"}
            {step === "subgroup" && "Выбери подгруппу"}
          </h1>
          <p className="hint" style={{ lineHeight: 1.5, margin: "8px 0 0" }}>
            {step === "course" && "Сначала укажи курс — покажем группы."}
            {step === "group" && `Группы ${course} курса.`}
            {step === "subgroup" && "Подгруппа уточняет расписание именно для тебя."}
          </p>
        </div>

        {step !== "course" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <span className="chip">{course} курс</span>
            {selectedGroup && <span className="chip">группа {selectedGroup.number}</span>}
          </div>
        )}

        {step === "course" && (
          <div className="picker-grid cols-2 fade-in">
            {[1, 2, 3, 4, 5, 6].map(x => (
              <button key={x} className="pick-btn" onClick={() => selectCourse(x)}>
                {x} курс
              </button>
            ))}
          </div>
        )}

        {step === "group" && (
          <div className="picker-grid cols-2 fade-in">
            {groupsLoading && (
              <div className="hint" style={{ gridColumn: "1 / -1", padding: 20, textAlign: "center" }}>
                Загружаем группы…
              </div>
            )}
            {!groupsLoading && groups.length === 0 && !error && (
              <div className="hint" style={{ gridColumn: "1 / -1", padding: 20, textAlign: "center" }}>
                Группы не найдены.
              </div>
            )}
            {!groupsLoading && groups.map(group => (
              <button key={group.id} className="pick-btn" onClick={() => selectGroup(group)}>
                {group.number}
              </button>
            ))}
            <button
              className="secondary"
              style={{ gridColumn: "1 / -1", marginTop: 4 }}
              onClick={() => setCourse(null)}
            >
              ← Назад
            </button>
          </div>
        )}

        {step === "subgroup" && (
          <div className="picker-grid fade-in">
            {subgroupsLoading && (
              <div className="hint" style={{ padding: 20, textAlign: "center" }}>
                Загружаем подгруппы…
              </div>
            )}
            {!subgroupsLoading && !saving && (
              <>
                <button className="pick-btn" onClick={() => selectSubgroup("all")}>
                  Вся группа
                </button>
                {subgroups.map(sub => (
                  <button key={sub} className="pick-btn" onClick={() => selectSubgroup(sub as Subgroup)}>
                    {sub} подгруппа
                  </button>
                ))}
                <button
                  className="secondary"
                  style={{ marginTop: 4 }}
                  onClick={() => { setSelectedGroup(null); setSubgroups([]); }}
                >
                  ← Назад
                </button>
              </>
            )}
            {saving && <div className="hint" style={{ padding: 20, textAlign: "center" }}>Сохраняем…</div>}
          </div>
        )}

        {error && (
          <div style={{ color: "#ef4444", marginTop: 16, textAlign: "center", fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>
    </main>
  );
}