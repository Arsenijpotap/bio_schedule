import { NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/telegram";
import { getLastUpdated } from "@/lib/repository";

export async function GET(request: Request) {
  const tgUser = getTelegramUserFromRequest(request);
  if (!tgUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lastUpdated = await getLastUpdated();

  return NextResponse.json({ lastUpdated });
}