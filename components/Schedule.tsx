"use client";

import { getTelegramInitData } from "@/components/TelegramInit";
import { useEffect, useMemo, useState } from "react";
import type { Lesson, UserSettings } from "@/types";

const WEEKDAY_NAMES = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота"
];

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function currentWeekMonday() {
  const now = new Date();
  if (now.getDay() === 0) now.setDate(now.getDate() + 1);
  return getMonday(now);
}

function dateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDay(d: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long"
  }).format(d);
}

function formatWeekRange(monday: Date) {
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);

  if (monday.getMonth() === end.getMonth()) {
    return `${monday.getDate()} — ${formatDay(end)}`;
  }
  return `${formatDay(monday)} — ${formatDay(end)}`;
}

function dayKey(lesson: Lesson) {
  return lesson.date || lesson.weekday || "День";
}

function lessonKind(type?: string) {
  const t = type?.toLowerCase() ?? "";
  if (t.includes("лекц")) return "lecture";
  if (t.includes("практ")) return "practice";
  if (t.includes("лаб") || t.includes("семин")) return "lab";
  return "other";
}

function parseTime(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})[–-](\d{1,2}):(\d{2})/);
  if (!match) return null;

  const [, startHour, startMin, endHour, endMin] = match.map(Number);
  return {
    start: startHour * 60 + startMin,
    end: endHour * 60 + endMin
  };
}

function lessonProgress(time: string, dayIndex: number, weekStart: Date) {
  const lessonDate = new Date(weekStart);
  lessonDate.setDate(weekStart.getDate() + dayIndex);
  lessonDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = (lessonDate.getTime() - today.getTime()) / 86400000;
  if (diffDays < 0) return 1;
  if (diffDays > 0) return 0;

  const parsed = parseTime(time);
  if (!parsed) return 0;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (nowMinutes < parsed.start) return 0;
  if (nowMinutes >= parsed.end) return 1;
  return (nowMinutes - parsed.start) / (parsed.end - parsed.start);
}

const KIND_COLORS: Record<string, string> = {
  lecture: "#2481cc",
  practice: "#22a06b",
  lab: "#8b5cf6",
  other: "#9aa4ad"
};

function formatLastUpdate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

export default function Schedule({
  settings,
  onChange
}: {
  settings: UserSettings;
  onChange: () => void;
}) {
  const [week, setWeek] = useState(() => currentWeekMonday());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [weekEmpty, setWeekEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const currentMonday = currentWeekMonday();
  const isCurrentWeek = dateString(week) === dateString(currentMonday);
  const todayIndex = (new Date().getDay() + 6) % 7;
  const todayName = todayIndex < WEEKDAY_NAMES.length
    ? WEEKDAY_NAMES[todayIndex]
    : null;

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
      setWeekEmpty(Boolean(data.weekEmpty));
    } catch {
      setError("Не удалось загрузить расписание. Обнови страницу и попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [week]);

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
        // не критично для расписания
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading && isCurrentWeek && todayName) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(`day-${todayName}`)?.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start"
      });
    }
  }, [loading, isCurrentWeek, todayName]);

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
    <main className="app" id="main">
      <header style={{
        position: "sticky", top: 0, zIndex: 5,
        background: "color-mix(in srgb, var(--tg-bg) 92%, transparent)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--tg-secondary)"
      }}>
        <div className="container" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 21, margin: 0 }}>Расписание</h1>
              <div className="hint" style={{ fontSize: 13 }}>
                {settings.course} курс · {settings.groupName}
                {settings.subgroup !== "all" ? ` · ${settings.subgroup} подгруппа` : ""}
              </div>
            </div>
            <button className="icon-btn" onClick={onChange} aria-label="Настройки" title="Настройки">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "48px 1fr 48px",
            gap: 8, alignItems: "center", marginTop: 14
          }}>
            <button className="secondary" onClick={() => moveWeek(-7)}>←</button>
            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 14 }}>
              {formatWeekRange(week)}
            </div>
            <button className="secondary" onClick={() => moveWeek(7)}>→</button>
          </div>

          {!isCurrentWeek && (
            <button
              className="secondary"
              style={{
                marginTop: 10,
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
              onClick={() => setWeek(currentWeekMonday())}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Вернуться на текущую неделю
            </button>
          )}
        </div>
      </header>

      <section className="container">
        {loading && <div className="hint" style={{ padding: 48, textAlign: "center" }} aria-live="polite">Загружаем…</div>}

        {!loading && error && (
          <div className="card" style={{ color: "#ef4444", textAlign: "center" }} aria-live="polite">{error}</div>
        )}

        {!loading && !error && !lessons.length && (
          <div className="card" style={{ textAlign: "center" }}>
            <b>{weekEmpty ? "Расписание на эту неделю пока не добавлено" : "Занятий нет"}</b>
            <div className="hint" style={{ marginTop: 6 }}>
              {weekEmpty
                ? "Попробуй заглянуть позже или выбрать другую неделю."
                : "Для этой недели ничего не найдено."}
            </div>
          </div>
        )}

        {!loading && !error && grouped.map(([day, items]) => (
          <div
            key={day}
            id={`day-${day}`}
            style={{ marginBottom: 18, scrollMarginTop: 130 }}
          >
            <h2 style={{ fontSize: 15, margin: "10px 4px", display: "flex", alignItems: "center", gap: 8 }}>
              {day}
              {isCurrentWeek && day === todayName && (
                <span className="today-badge">Сегодня</span>
              )}
            </h2>

            <div style={{ display: "grid", gap: 9 }}>
              {items.map(lesson => {
                const dayIndex = WEEKDAY_NAMES.indexOf(lesson.weekday);
                const kind = lessonKind(lesson.type);
                const fill = lessonProgress(lesson.time, dayIndex, week);
                const current = fill > 0 && fill < 1;
                const [timeStart, timeEnd] = lesson.time
                  .split(/[–-]/)
                  .map(part => part.trim());

                return (
                  <article
                    key={lesson.id}
                    className={`card lesson-card lesson-${kind}`}
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      background: `linear-gradient(90deg, color-mix(in srgb, ${KIND_COLORS[kind]} 16%, var(--tg-card)) ${Math.round(fill * 100)}%, var(--tg-card) ${Math.round(fill * 100)}%)`
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 14 }}>
                      <div>
                        <b>{timeStart}</b>
                        {timeEnd && <div className="hint" style={{ fontSize: 12, marginTop: 2 }}>{timeEnd}</div>}
                        {lesson.room && <div className="hint" style={{ fontSize: 12, marginTop: 5 }}>ауд. {lesson.room}</div>}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <div style={{ fontWeight: 750, minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word" }}>{lesson.subject}</div>
                          {current && <span className="current-badge">Сейчас</span>}
                        </div>
                        {lesson.type && (
                          <div className={`hint lesson-type-${kind}`} style={{ marginTop: 4, fontSize: 13, fontWeight: 600 }}>
                            {lesson.type}
                          </div>
                        )}
                        {lesson.teacher && <div style={{ marginTop: 5, fontSize: 14, overflowWrap: "anywhere", wordBreak: "break-word" }}>{lesson.teacher}</div>}
                        {(() => {
                          const isDefault = lesson.address &&
                            lesson.address.trim().toLowerCase() === "курчатова 10";
                          const address = lesson.address && !isDefault ? lesson.address.trim() : "";
                          if (!address && !lesson.comment) return null;
                          return (
                            <div className="hint" style={{ marginTop: 5, fontSize: 12, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                              {address && <span>{address}</span>}
                              {address && lesson.comment ? " · " : ""}
                              {lesson.comment || ""}
                            </div>
                          );
                        })()}
                        {(lesson.group || lesson.subgroup) && (
                          <div className="hint" style={{ marginTop: 5, fontSize: 12, overflowWrap: "anywhere", wordBreak: "break-word" }}>
                            {lesson.group && `гр. ${lesson.group}`}
                            {lesson.subgroup && lesson.subgroup !== "all"
                              ? `${lesson.group ? " · " : ""}${lesson.subgroup} подгруппа`
                              : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {lastUpdate && (
        <footer className="container">
          <div className="hint" style={{ textAlign: "center", fontSize: 12, padding: "8px 0 24px" }}>
            Последнее обновление расписания: {formatLastUpdate(lastUpdate)}
          </div>
        </footer>
      )}
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