import { NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/telegram";
import { fetchGroups } from "@/lib/source";
import { getCachedGroups, saveCachedGroups } from "@/lib/repository";

export async function GET(request: Request) {
  const tgUser = getTelegramUserFromRequest(request);
  if (!tgUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const course = Number(url.searchParams.get("course") ?? "1");

  try {
    let groups = await getCachedGroups(course);

    if (!groups) {
      groups = await fetchGroups(course);
      await saveCachedGroups(course, groups);
    }

    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ groups: [], warning: "Не удалось автоматически получить группы" });
  }
}