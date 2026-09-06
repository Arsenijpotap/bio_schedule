import type { Lesson } from "@/types";

const BASE_URL = (process.env.BSU_SCHEDULE_URL || "https://bio.bsu.by/schedule/")
  .replace(/\/?$/, "/");

const TIMESLOTS: Record<number, string> = {
  1: "09:00–10:25",
  2: "10:35–12:00",
  3: "12:10–13:35",
  4: "14:00–15:25",
  5: "15:35–17:00",
  6: "17:10–18:35",
  7: "18:45–20:10",
  8: "20:30–21:55"
};

const DAY_NAMES = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота"
];

type ApiGroup = { id: number; number: string; name: string; course: number };

type ApiLesson = {
  id: number;
  day: number;
  slot_id: number;
  discipline: string;
  teacher: string;
  room: string;
  address?: string;
  comment?: string;
  lesson_type: string;
  lesson_type_display: string;
  group_ids: number[];
  subgroup_name: string | null;
};

async function api<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 BSU-Schedule-MiniApp/1.0",
      "Accept": "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`BSU API ${path} returned ${response.status}`);
  }

  return response.json();
}

export type GroupOption = { id: number; number: string; name: string };

export async function fetchGroups(course: number): Promise<GroupOption[]> {
  const data = await api<{ groups: ApiGroup[] }>("api/get-groups/", {
    study_mode: "Дневная",
    course: String(course)
  });

  return (data.groups || []).map(group => ({
    id: group.id,
    number: group.number,
    name: group.name
  }));
}

export async function fetchSubgroups(groupId: number): Promise<string[]> {
  const data = await api<{ subgroups: { id: number; name: string }[] }>(
    "api/get-subgroups/",
    { group_id: String(groupId) }
  );

  return (data.subgroups || [])
    .map(subgroup => subgroup.name.match(/Подгруппа\s*(\d+)/i)?.[1])
    .filter((value): value is string => Boolean(value));
}

export async function fetchSchedule(course: number, weekDate: string) {
  const [groupsData, weekData] = await Promise.all([
    api<{ groups: ApiGroup[] }>("api/get-groups/", {
      study_mode: "Дневная",
      course: String(course)
    }),
    api<{ week: { id: number; starts_on: string; is_empty: boolean } }>("api/get-week-for-date/", {
      study_mode: "Дневная",
      course: String(course),
      date: weekDate
    }).catch(() => null)
  ]);

  const numberById = new Map(
    (groupsData.groups || []).map(group => [group.id, group.number])
  );

  const week = weekData?.week;
  if (!week?.id) {
    return { weekDate, course, weekId: null, weekEmpty: true, lessons: [] };
  }

  const schedule = await api<{ lessons: ApiLesson[] }>("api/get-schedule/", {
    study_mode: "Дневная",
    course: String(course),
    week_id: String(week.id)
  });

  const startsOn = new Date(`${week.starts_on}T00:00:00`);

  const lessons: Lesson[] = (schedule.lessons || [])
    .map(lesson => {
      const groupNumbers = (lesson.group_ids || [])
        .map(id => numberById.get(id) ?? String(id))
        .filter(Boolean);

      const dayDate = new Date(startsOn);
      dayDate.setDate(startsOn.getDate() + lesson.day);

      const subgroupMatch = lesson.subgroup_name?.match(/Подгруппа\s*(\d+)/i);

      return {
        id: String(lesson.id),
        date: "",
        weekday: DAY_NAMES[lesson.day] ?? "",
        time: TIMESLOTS[lesson.slot_id] ?? "",
        subject: lesson.discipline,
        type: lesson.lesson_type_display || lesson.lesson_type,
        teacher: lesson.teacher,
        room: lesson.room,
        address: lesson.address,
        comment: lesson.comment,
        group: groupNumbers.join(", "),
        subgroup: subgroupMatch?.[1] ?? ""
      };
    })
    .sort((a, b) => {
      const aIndex = DAY_NAMES.indexOf(a.weekday);
      const bIndex = DAY_NAMES.indexOf(b.weekday);
      return (aIndex - bIndex) || a.time.localeCompare(b.time);
    });

  return { weekDate, course, weekId: week.id, weekEmpty: Boolean(week.is_empty), lessons };
}

export function filterLessons(
  lessons: Lesson[],
  groupName: string,
  subgroup: string
) {
  return lessons.filter(lesson => {
    if (lesson.group && groupName) {
      const groups = lesson.group.split(",").map(g => g.trim().toLowerCase());
      const matches = groups.some(g => g === groupName.toLowerCase());
      if (!matches) return false;
    }

    if (subgroup !== "all" && lesson.subgroup && lesson.subgroup !== subgroup) {
      return false;
    }

    return true;
  });
}