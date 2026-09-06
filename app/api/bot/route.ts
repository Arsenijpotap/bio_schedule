import { NextResponse } from "next/server";

const WELCOME_TEXT =
  "Привет! Это бот с расписанием занятий БГУ.\n\n" +
  "Нажмите кнопку ниже, чтобы открыть приложение и выбрать свою группу.";

function getAppUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    ""
  )
    .replace(/\/?$/, "")
    .replace(/^/, "https://");
}

async function telegram(method: string, body: Record<string, unknown>) {
  const token = process.env.BOT_TOKEN;
  if (!token) return null;

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  return res.json();
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    secret !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const update = await request.json();
  const message = update?.message;

  if (message?.text === "/start") {
    const appUrl = getAppUrl();
    await telegram("sendMessage", {
      chat_id: message.chat.id,
      text: WELCOME_TEXT,
      reply_markup: {
        inline_keyboard: [[
          { text: "Открыть расписание", web_app: { url: appUrl } }
        ]]
      }
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!process.env.BOT_TOKEN) {
    return NextResponse.json(
      { error: "BOT_TOKEN is not configured" },
      { status: 400 }
    );
  }

  const appUrl = getAppUrl();
  if (!appUrl) {
    return NextResponse.json(
      { error: "APP_URL / VERCEL_URL is not configured" },
      { status: 400 }
    );
  }

  const result = await telegram("setWebhook", {
    url: `${appUrl}/api/bot`,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    allowed_updates: ["message"]
  });

  return NextResponse.json(result);
}
