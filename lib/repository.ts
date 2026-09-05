import { getDb } from "@/lib/db";
import type { Subgroup, UserSettings } from "@/types";

export async function findUser(telegramId: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT telegram_id, course, group_name, subgroup
    FROM users
    WHERE telegram_id = ${telegramId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function upsertUser(
  telegramId: string,
  settings: UserSettings,
  profile?: { username?: string; first_name?: string; last_name?: string }
) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO users (
      telegram_id, username, first_name, last_name,
      course, group_name, subgroup
    )
    VALUES (
      ${telegramId},
      ${profile?.username ?? null},
      ${profile?.first_name ?? null},
      ${profile?.last_name ?? null},
      ${settings.course},
      ${settings.groupName},
      ${settings.subgroup}
    )
    ON CONFLICT (telegram_id)
    DO UPDATE SET
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      course = EXCLUDED.course,
      group_name = EXCLUDED.group_name,
      subgroup = EXCLUDED.subgroup,
      updated_at = NOW()
    RETURNING telegram_id, course, group_name, subgroup
  `;
  return rows[0];
}

export async function getCachedSchedule(course: number, weekDate: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT data, created_at
    FROM schedule_cache
    WHERE course = ${course} AND week_date = ${weekDate}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function saveCachedSchedule(
  course: number,
  weekDate: string,
  data: unknown
) {
  const sql = getDb();
  await sql`
    INSERT INTO schedule_cache(course, week_date, data)
    VALUES (${course}, ${weekDate}, ${JSON.stringify(data)})
    ON CONFLICT (course, week_date)
    DO UPDATE SET
      data = EXCLUDED.data,
      created_at = NOW()
  `;
}