import { NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/telegram";
import { findUser, getCachedSchedule, saveCachedSchedule } from "@/lib/repository";
import { fetchSchedule, filterLessons } from "@/lib/source";

const TTL = Number(process.env.SCHEDULE_CACHE_TTL ?? "900");

export async function GET(request: Request) {
  const tgUser = getTelegramUserFromRequest(request);
  if (!tgUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const weekDate = url.searchParams.get("week_date");

  if (!weekDate || !/^\\d{4}-\\d{2}-\\d{2}$/.test(weekDate)) {
    return NextResponse.json({ error: "week_date is required" }, { status: 400 });
  }

  const user = await findUser(String(tgUser.id));
  if (!user) return NextResponse.json({ error: "SETUP_REQUIRED" }, { status: 409 });

  let schedule: any = null;
  const cached = await getCachedSchedule(user.course, weekDate);

  if (cached) {
    const age = (Date.now() - new Date(cached.created_at).getTime()) / 1000;
    if (age < TTL) schedule = cached.data;
  }

  if (!schedule) {
    schedule = await fetchSchedule(user.course, weekDate);
    await saveCachedSchedule(user.course, weekDate, schedule);
  }

  const lessons = filterLessons(
    schedule.lessons,
    user.group_name,
    user.subgroup
  );

  return NextResponse.json({
    weekDate,
    course: user.course,
    groupName: user.group_name,
    subgroup: user.subgroup,
    lessons
  });
}