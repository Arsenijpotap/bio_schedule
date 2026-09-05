import { NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/telegram";
import { fetchSchedule } from "@/lib/source";

export async function GET(request: Request) {
  const tgUser = getTelegramUserFromRequest(request);
  if (!tgUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const course = Number(url.searchParams.get("course") ?? "1");
  const weekDate = url.searchParams.get("week_date") ?? new Date().toISOString().slice(0, 10);

  try {
    const data = await fetchSchedule(course, weekDate);
    const groups = [...new Set(data.lessons.map(x => x.group).filter(Boolean))].sort();

    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ groups: [], warning: "Не удалось автоматически получить группы" });
  }
}