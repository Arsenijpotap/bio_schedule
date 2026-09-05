import { NextResponse } from "next/server";
import { getTelegramUserFromRequest } from "@/lib/telegram";
import { findUser } from "@/lib/repository";

export async function GET(request: Request) {
  const tgUser = getTelegramUserFromRequest(request);

  if (!tgUser) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }

  const user = await findUser(String(tgUser.id));

  return NextResponse.json({
    authenticated: true,
    user: user
      ? {
          telegramId: user.telegram_id,
          course: user.course,
          groupName: user.group_name,
          subgroup: user.subgroup
        }
      : null
  });
}