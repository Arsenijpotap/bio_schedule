# Быстрый деплой

1. Создай GitHub repository и загрузи проект.
2. Импортируй repository в Vercel.
3. В Vercel → Settings → Environment Variables добавь:
   - DATABASE_URL
   - BOT_TOKEN
   - SCHEDULE_CACHE_TTL=900
4. После первого deploy выполни миграцию локально:
   `DATABASE_URL="..." npm run db:migrate`
5. Создай Telegram Web App у бота и укажи Vercel URL.
6. Открой Mini App через Telegram.

Если Neon connection string с pooler используется для обычных запросов Next.js, `@neondatabase/serverless` подходит для serverless/Vercel.
