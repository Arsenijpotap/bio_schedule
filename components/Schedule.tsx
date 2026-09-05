"use client";

import { getTelegramInitData } from "@/components/TelegramInit";
import { useEffect, useMemo, useState } from "react";
import type { Lesson, UserSettings } from "@/types";

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatWeek(d: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long"
  }).format(d);
}

function dayKey(lesson: Lesson) {
  return lesson.date || lesson.weekday || "День";
}

export default function Schedule({
  settings,
  onChange
}: {
  settings: UserSettings;
  onChange: () => void;
}) {
  const [week, setWeek] = useState(() => getMonday(new Date()));
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const init = await getTelegramInitData();
      const res = await fetch(`/api/schedule?week_date=${dateString(week)}`, {
        headers: {
          "x-telegram-init-data": init,
          "Authorization": init ? `tma ${init}` : ""
        },
        cache: "no-store"
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setLessons(data.lessons ?? []);
    } catch {
      setError("Не удалось загрузить расписание.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [week]);

  const grouped = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      const key = dayKey(lesson);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(lesson);
    }
    return [...map.entries()];
  }, [lessons]);

  return (
    <main className="app">
      <header style={{
        position: "sticky", top: 0, zIndex: 5,
        background: "color-mix(in srgb, var(--tg-bg) 92%, transparent)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--tg-secondary)"
      }}>
        <div className="container" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 21 }}>Расписание</div>
              <div className="hint" style={{ fontSize: 13 }}>
                {settings.course} курс · {settings.groupName}
                {settings.subgroup !== "all" ? ` · ${settings.subgroup} подгруппа` : ""}
              </div>
            </div>
            <button className="secondary" onClick={onChange}>Изменить</button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "48px 1fr 48px",
            gap: 8, alignItems: "center", marginTop: 14
          }}>
            <button className="secondary" onClick={() => moveWeek(-7)}>←</button>
            <div style={{ textAlign: "center", fontWeight: 700 }}>{formatWeek(week)}</div>
            <button className="secondary" onClick={() => moveWeek(7)}>→</button>
          </div>
        </div>
      </header>

      <section className="container">
        {loading && <div className="hint" style={{ padding: 48, textAlign: "center" }}>Загружаем…</div>}

        {!loading && error && (
          <div className="card" style={{ color: "#ef4444", textAlign: "center" }}>{error}</div>
        )}

        {!loading && !error && !lessons.length && (
          <div className="card" style={{ textAlign: "center" }}>
            <b>Занятий нет</b>
            <div className="hint" style={{ marginTop: 6 }}>Для этой недели ничего не найдено.</div>
          </div>
        )}

        {!loading && !error && grouped.map(([day, items]) => (
          <div key={day} style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, margin: "10px 4px" }}>{day}</h2>

            <div style={{ display: "grid", gap: 9 }}>
              {items.map(lesson => (
                <article className="card" key={lesson.id}>
                  <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 14 }}>
                    <div>
                      <b>{lesson.time}</b>
                      {lesson.room && <div className="hint" style={{ fontSize: 12, marginTop: 5 }}>ауд. {lesson.room}</div>}
                    </div>

                    <div>
                      <div style={{ fontWeight: 750 }}>{lesson.subject}</div>
                      {lesson.type && <div className="hint" style={{ marginTop: 4, fontSize: 13 }}>{lesson.type}</div>}
                      {lesson.teacher && <div style={{ marginTop: 5, fontSize: 14 }}>{lesson.teacher}</div>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );

  function moveWeek(days: number) {
    setWeek(current => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      return next;
    });
  }
}