import crypto from "node:crypto";
import type { TelegramUser } from "@/types";

function parseInitData(initData: string) {
  const params = new URLSearchParams(initData);
  const data: Record<string, string> = {};

  for (const [key, value] of params.entries()) data[key] = value;

  return { params, data };
}

export function validateTelegramInitData(initData: string): TelegramUser | null {
  if (!initData) return null;

  const { data } = parseInitData(initData);
  const receivedHash = data.hash;

  if (!receivedHash) return null;

  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    if (process.env.NODE_ENV !== "production" && process.env.DEV_TELEGRAM_ID) {
      return { id: Number(process.env.DEV_TELEGRAM_ID), first_name: "Dev" };
    }
    return null;
  }

  const checkString = Object.keys(data)
    .filter(k => k !== "hash")
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  if (
    calculatedHash.length !== receivedHash.length ||
    !crypto.timingSafeEqual(
      Buffer.from(calculatedHash),
      Buffer.from(receivedHash)
    )
  ) return null;

  try {
    const user = JSON.parse(data.user ?? "{}") as TelegramUser;
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

export function getTelegramUserFromRequest(request: Request): TelegramUser | null {
  let initData = request.headers.get("x-telegram-init-data") ?? "";
  if (!initData) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth.toLowerCase().startsWith("tma ")) {
      initData = auth.slice(4);
    }
  }
  return validateTelegramInitData(initData);
}