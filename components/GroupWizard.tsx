"use client";

import { useEffect, useState } from "react";
import { getTelegramInitData } from "@/components/TelegramInit";
import type { Subgroup, UserSettings } from "@/types";

type GroupOption = { id: number; number: string; name: string };

export default function GroupWizard({
  onSaved,
  onStepChange
}: {
  onSaved: (settings: UserSettings) => void;
  onStepChange?: (step: "course" | "group" | "subgroup") => void;
}) {
  const [course, setCourse] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupOption | null>(null);
  const [subgroups, setSubgroups] = useState<string[]>([]);
  const [subgroupsLoading, setSubgroupsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const step = course === null ? "course" : selectedGroup === null ? "group" : "subgroup";

  useEffect(() => { onStepChange?.(step); }, [step, onStepChange]);

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
      setError("Не удалось загрузить группы. Попробуй ещё раз.");
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
      setError("Не удалось загрузить подгруппы. Попробуй ещё раз.");
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
        setError("Не удалось сохранить настройки. Попробуй ещё раз.");
        setSaving(false);
        return;
      }

      onSaved({
        course,
        groupName: selectedGroup.number,
        subgroup: value
      });
    } catch {
      setError("Не удалось сохранить настройки. Попробуй ещё раз.");
      setSaving(false);
    }
  }

  return (
    <>
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
          {groupsLoading && <div className="hint" style={{ padding: 16, textAlign: "center" }} aria-live="polite">Загружаем группы…</div>}
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
          {subgroupsLoading && <div className="hint" style={{ padding: 16, textAlign: "center" }} aria-live="polite">Загружаем подгруппы…</div>}
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
          {saving && <div className="hint" style={{ padding: 16, textAlign: "center" }} aria-live="polite">Сохраняем…</div>}
        </div>
      )}

      {error && <div style={{ color: "#ef4444", marginTop: 14 }}>{error}</div>}
    </>
  );
}
