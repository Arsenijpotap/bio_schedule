import { NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/telegram";
import { fetchSchedule } from "@/lib/source";
import { getCachedSchedule, saveCachedSchedule } from "@/lib/repository";

function monday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function currentMonday() {
  const now = new Date();
  if (now.getDay() === 0) now.setDate(now.getDate() + 1);
  return monday(now);
}

function collectSubgroups(
  lessons: { group?: string; subgroup?: string }[],
  groupNumber: string
) {
  const subgroups = new Set<string>();

  for (const lesson of lessons) {
    if (!lesson.subgroup) continue;
    const groups = (lesson.group ?? "")
      .split(",")
      .map(group => group.trim().toLowerCase());
    if (!groups.includes(groupNumber.toLowerCase())) continue;
    subgroups.add(lesson.subgroup);
  }

  return [...subgroups];
}

async function loadWeekLessons(course: number, weekDate: string) {
  const cached = await getCachedSchedule(course, weekDate);
  if (cached?.data?.lessons) return cached.data.lessons;

  const schedule = await fetchSchedule(course, weekDate);
  if (schedule.weekId) await saveCachedSchedule(course, weekDate, schedule);
  return schedule.lessons;
}

export async function GET(request: Request) {
  const tgUser = getTelegramUserFromRequest(request);
  if (!tgUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const course = Number(url.searchParams.get("course"));
  const groupNumber = String(url.searchParams.get("group") ?? "").trim();

  if (!course || !groupNumber) {
    return NextResponse.json({ error: "course and group are required" }, { status: 400 });
  }

  try {
    const lessons = await loadWeekLessons(course, currentMonday());

    const subgroups = collectSubgroups(lessons, groupNumber);

    return NextResponse.json({ subgroups });
  } catch {
    return NextResponse.json({ subgroups: [], warning: "Не удалось получить подгруппы" });
  }
}