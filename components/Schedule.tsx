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

function kindColor(kind: string) {
  if (kind === "lecture") return "var(--accent-lecture)";
  if (kind === "practice") return "var(--accent-practice)";
  if (kind === "lab") return "var(--accent-lab)";
  return "var(--accent-other)";
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
      setError("Не удалось загрузить расписание.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [week]);

  useEffect(() => {
    if (!loading && isCurrentWeek && todayName) {
      document.getElementById(`day-${todayName}`)?.scrollIntoView({
        behavior: "smooth",
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
    <main className="app">
      <header className="app-header">
        <div className="container" style={{ paddingTop: 14, paddingBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: .2 }}>Расписание</div>
              <div className="hint" style={{ fontSize: 13, marginTop: 2 }}>
                {settings.course} курс · {settings.groupName}
                {settings.subgroup !== "all" ? ` · ${settings.subgroup} подгруппа` : ""}
              </div>
            </div>
            <button className="icon-btn" onClick={onChange} aria-label="Настройки" title="Настройки">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>

          <div className="week-nav">
            <button className="week-btn" onClick={() => moveWeek(-7)} aria-label="Предыдущая неделя">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="week-range">{formatWeekRange(week)}</div>
            <button className="week-btn" onClick={() => moveWeek(7)} aria-label="Следующая неделя">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {!isCurrentWeek && (
            <button className="secondary back-current" onClick={() => setWeek(currentWeekMonday())}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        {loading && (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && error && (
          <div className="card" style={{ color: "#ef4444", textAlign: "center", fontWeight: 600 }}>
            {error}
          </div>
        )}

        {!loading && !error && !lessons.length && (
          <div className="card empty-state fade-in">
            <div className="icon">📅</div>
            <b>{weekEmpty ? "Расписание на эту неделю пока не добавлено" : "Занятий нет"}</b>
            <div className="hint" style={{ marginTop: 6 }}>
              {weekEmpty
                ? "Загляни позже или выбери другую неделю."
                : "Для этой недели ничего не найдено."}
            </div>
          </div>
        )}

        {!loading && !error && grouped.map(([day, items]) => (
          <div
            key={day}
            id={`day-${day}`}
            style={{ marginBottom: 14, scrollMarginTop: 120 }}
          >
            <div className={`day-heading${isCurrentWeek && day === todayName ? " today" : ""}`}>
              <span className="bar" />
              <span>{day}</span>
              {isCurrentWeek && day === todayName && (
                <span className="today-badge">Сегодня</span>
              )}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {items.map(lesson => {
                const dayIndex = WEEKDAY_NAMES.indexOf(lesson.weekday);
                const kind = lessonKind(lesson.type);
                const fill = lessonProgress(lesson.time, dayIndex, week);
                const current = fill > 0 && fill < 1;
                const color = kindColor(kind);
                const [timeStart, timeEnd] = lesson.time
                  .split(/[–-]/)
                  .map(part => part.trim());
                const isDefaultAddress = lesson.address &&
                  lesson.address.trim().toLowerCase() === "курчатова 10";
                const address = lesson.address && !isDefaultAddress ? lesson.address.trim() : "";

                return (
                  <article
                    key={lesson.id}
                    className={`lesson-card lesson-${kind}${current ? " lesson-current" : ""} fade-in`}
                  >
                    <div
                      className="lesson-progress"
                      style={{ background: color, width: `${Math.round(fill * 100)}%` }}
                    />

                    <div className="lesson-time">
                      <span className="start">{timeStart}</span>
                      {timeEnd && <span className="end">{timeEnd}</span>}
                      {lesson.room && <span className="room">ауд. {lesson.room}</span>}
                    </div>

                    <div>
                      <div className="lesson-top">
                        <span className="lesson-subject">{lesson.subject}</span>
                        {current && <span className="current-badge">Сейчас</span>}
                      </div>
                      {lesson.type && (
                        <span className={`type-badge type-badge-${kind}`}>{lesson.type}</span>
                      )}
                      {lesson.teacher && <div className="lesson-meta">{lesson.teacher}</div>}
                      {(address || lesson.comment) && (
                        <div className="lesson-hint">
                          {address}
                          {address && lesson.comment ? " · " : ""}
                          {lesson.comment || ""}
                        </div>
                      )}
                      {(lesson.group || lesson.subgroup) && (
                        <div className="lesson-hint">
                          {lesson.group && `гр. ${lesson.group}`}
                          {lesson.subgroup && lesson.subgroup !== "all"
                            ? `${lesson.group ? " · " : ""}${lesson.subgroup} подгруппа`
                            : ""}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
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