import { NextResponse } from "next/server";
import { fetchGroups, fetchSchedule } from "@/lib/source";
import { saveCachedGroups, saveCachedSchedule } from "@/lib/repository";

export const maxDuration = 60;

function monday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = [1, 2, 3, 4, 5, 6];
  const weeks = [
    monday(new Date()),
    monday(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  ];

  const groupResults = await Promise.all(courses.map(async course => {
    try {
      const groups = await fetchGroups(course);
      await saveCachedGroups(course, groups);
      return { course, status: "ok" };
    } catch {
      return { course, status: "error" };
    }
  }));

  const scheduleJobs: { course: number; week: string }[] = [];
  for (const course of courses) {
    for (const week of weeks) {
      scheduleJobs.push({ course, week });
    }
  }

  const scheduleResults = await Promise.all(scheduleJobs.map(async job => {
    try {
      const schedule = await fetchSchedule(job.course, job.week);
      if (!schedule.weekId) return { ...job, status: "no-week" };
      await saveCachedSchedule(job.course, job.week, schedule);
      return { ...job, status: "ok" };
    } catch {
      return { ...job, status: "error" };
    }
  }));

  const groupsOk = groupResults.filter(r => r.status === "ok").length;
  const scheduleOk = scheduleResults.filter(r => r.status === "ok").length;
  const skipped = scheduleResults.filter(r => r.status === "no-week").length;
  const failed =
    groupResults.filter(r => r.status === "error").length +
    scheduleResults.filter(r => r.status === "error").length;

  return NextResponse.json({ ok: true, groups: groupsOk, schedule: scheduleOk, skipped, failed });
}