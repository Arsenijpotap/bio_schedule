# BSU Schedule Telegram Mini App

Next.js + Neon PostgreSQL + Telegram Mini App.

## 1. Install

```bash
npm install
cp .env.example .env.local
```

Set `DATABASE_URL` in `.env.local`.

For Telegram authentication also set:

```env
BOT_TOKEN=123456:ABC...
```

Do not commit `.env.local`.

## 2. Database

Run:

```bash
npm run db:migrate
```

The migration creates:

- `users`
- `schedule_cache`

## 3. Development

```bash
npm run dev
```

Telegram Mini Apps require HTTPS. For local Telegram testing use an HTTPS tunnel such as Cloudflare Tunnel/ngrok.

For ordinary browser testing you can temporarily set:

```env
DEV_TELEGRAM_ID=123456789
```

Only use this in local development.

## 4. Vercel

Import the project into Vercel.

Add environment variables:

- `DATABASE_URL`
- `BOT_TOKEN`
- `BSU_SCHEDULE_URL` (optional)
- `SCHEDULE_CACHE_TTL` (optional)

Build command:

```bash
npm run build
```

## 5. Telegram

Create a bot with BotFather and configure a Web App button/menu button pointing to the deployed Vercel HTTPS URL.

The backend validates Telegram `initData` using the bot token. Do not trust a Telegram ID sent by the client.

## 6. Schedule source

The backend requests:

`https://bio.bsu.by/schedule/?study_mode=Дневная&course=<course>&week_date=<YYYY-MM-DD>`

The parser uses a tolerant HTML/table strategy because the source page can change its markup. If BSU changes the page structure, update only `lib/source.ts`.

## 7. Important security note

Never put `DATABASE_URL`, `POSTGRES_PASSWORD`, or `BOT_TOKEN` in client code.

If a database password has been shared publicly, rotate it in Neon before deploying.

## Vercel troubleshooting

If the build says `DATABASE_URL is not configured`, add `DATABASE_URL` under:
Vercel → Project → Settings → Environment Variables

Enable it for Production, Preview, and Development as needed, then redeploy.
The database module intentionally does not read `DATABASE_URL` during Next.js build time;
it creates the Neon client only when an API request executes.
