import * as cheerio from "cheerio";
import type { Lesson } from "@/types";

const BASE_URL = process.env.BSU_SCHEDULE_URL || "https://bio.bsu.by/schedule/";

function clean(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function stripHtml(value: string) {
  return clean(value.replace(/<[^>]*>/g, " "));
}

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function looksLikeTime(value: string) {
  return /^\\d{1,2}[:.]\\d{2}(?:\\s*[–-]\\s*\\d{1,2}[:.]\\d{2})?$/.test(value);
}

function extractGroup(value: string) {
  const m = value.match(/(?:гр\\.?|группа)\\s*([0-9]{1,3}[А-ЯA-Zа-яa-z]?)/i);
  return m?.[1] ?? "";
}

function extractSubgroup(value: string) {
  const m = value.match(/(?:подгруппа|п\/г|пг)\\s*([12])/i);
  return m?.[1] ?? "";
}

function parseRows($: cheerio.CheerioAPI): Lesson[] {
  const lessons: Lesson[] = [];

  $("table tr").each((rowIndex, tr) => {
    const cells = $(tr)
      .find("th,td")
      .map((_, cell) => clean($(cell).text()))
      .get()
      .filter(Boolean);

    if (cells.length < 3) return;

    const timeIndex = cells.findIndex(looksLikeTime);
    if (timeIndex < 0) return;

    const time = cells[timeIndex];
    const after = cells.slice(timeIndex + 1);
    const before = cells.slice(0, timeIndex);

    const subjectCell = after.find(x =>
      !looksLikeTime(x) &&
      !/^\\d{1,2}[./-]\\d{1,2}/.test(x) &&
      x.length > 2
    ) ?? after[0] ?? "";

    if (!subjectCell) return;

    const whole = cells.join(" | ");
    const group = extractGroup(whole);
    const subgroup = extractSubgroup(whole);

    const roomMatch = whole.match(/(?:ауд\\.?|аудитория)\\s*([\\w-]+)/i);

    lessons.push({
      id: hash(`${rowIndex}|${whole}`),
      date: before.find(x => /^\\d{1,2}[./-]\\d{1,2}/.test(x)) ?? "",
      weekday: before.find(x => /^(пн|вт|ср|чт|пт|сб|вс|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье)/i.test(x)) ?? "",
      time,
      subject: subjectCell,
      type: after.find(x => /лек|лаб|практ|семин|консульт/i.test(x)) ?? "",
      teacher: after.find(x => /[А-ЯЁ][а-яё]+\\s+[А-ЯЁ]\\.?[А-ЯЁ]?\\.?/.test(x)) ?? "",
      room: roomMatch?.[1] ?? "",
      group,
      subgroup
    });
  });

  return lessons;
}

function parseDivSchedule($: cheerio.CheerioAPI): Lesson[] {
  const lessons: Lesson[] = [];

  $("body *").each((index, el) => {
    const text = clean($(el).text());
    if (!looksLikeTime(text) || text.length > 100) return;

    const parent = $(el).parent();
    const block = clean(parent.text());
    if (block.length < 5 || block.length > 500) return;

    const lines = block.split(/\\n+/).map(clean).filter(Boolean);
    const time = lines.find(looksLikeTime);
    const subject = lines.find(x => x !== time && x.length > 2);

    if (!time || !subject) return;

    lessons.push({
      id: hash(`${index}|${block}`),
      date: "",
      weekday: "",
      time,
      subject,
      group: extractGroup(block),
      subgroup: extractSubgroup(block)
    });
  });

  return lessons;
}

export async function fetchSchedule(course: number, weekDate: string) {
  const url = new URL(BASE_URL);
  url.searchParams.set("study_mode", "Дневная");
  url.searchParams.set("course", String(course));
  url.searchParams.set("week_date", weekDate);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 BSU-Schedule-MiniApp/1.0",
      "Accept": "text/html,application/xhtml+xml"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`BSU returned ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  let lessons = parseRows($);
  if (!lessons.length) lessons = parseDivSchedule($);

  return { weekDate, course, lessons };
}

export function filterLessons(
  lessons: Lesson[],
  groupName: string,
  subgroup: string
) {
  return lessons.filter(lesson => {
    if (lesson.group && groupName) {
      const exact = lesson.group.toLowerCase() === groupName.toLowerCase();
      const contains = lesson.group.toLowerCase().includes(groupName.toLowerCase());
      if (!exact && !contains) return false;
    }

    if (subgroup !== "all" && lesson.subgroup && lesson.subgroup !== subgroup) {
      return false;
    }

    return true;
  });
}