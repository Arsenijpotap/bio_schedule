import { NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/telegram";
import { upsertUser } from "@/lib/repository";

export async function POST(request: Request) {
  const tgUser = getTelegramUserFromRequest(request);

  if (!tgUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const course = Number(body.course);
  const groupName = String(body.groupName ?? "").trim();
  const subgroup = String(body.subgroup ?? "all");

  if (!Number.isInteger(course) || course < 1 || course > 6) {
    return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  }

  if (!groupName || groupName.length > 50) {
    return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  }

  if (!["all", "1", "2"].includes(subgroup)) {
    return NextResponse.json({ error: "Invalid subgroup" }, { status: 400 });
  }

  const user = await upsertUser(
    String(tgUser.id),
    { course, groupName, subgroup: subgroup as "all" | "1" | "2" },
    tgUser
  );

  return NextResponse.json({ ok: true, user });
}