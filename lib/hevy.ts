import "server-only";
import { addDays, localDay } from "@/lib/dates";

// Hevy public API (needs Hevy Pro). https://api.hevyapp.com/docs
const BASE = "https://api.hevyapp.com/v1";
const PAGE_SIZE = 10; // API maximum
const REVALIDATE_SECONDS = 300;

export type HevySet = {
  type: "warmup" | "normal" | "failure" | "dropset" | string;
  weight_kg?: number | null;
  reps?: number | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  rpe?: number | null;
};

export type HevyWorkout = {
  id: string;
  title: string;
  routine_id?: string | null;
  start_time: string;
  end_time: string;
  exercises: {
    title: string;
    exercise_template_id: string;
    sets: HevySet[];
  }[];
};

export type HevyRoutine = { id: string; title: string; folder_id?: number | null };
export type HevyFolder = { id: number; title: string; index?: number };
export type BodyMeasurement = { date: string; weight_kg?: number | null };

export class HevyNotConfigured extends Error {}

export function hevyConfigured() {
  return Boolean(process.env.HEVY_API_KEY);
}

async function hevyGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const key = process.env.HEVY_API_KEY;
  if (!key) throw new HevyNotConfigured("HEVY_API_KEY is not set");

  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    headers: { "api-key": key, accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS, tags: ["hevy"] },
  });
  // Hevy answers 404 for a page past the end of a list.
  if (res.status === 404) return {} as T;
  if (!res.ok) throw new Error(`Hevy ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function allPages<T>(path: string, key: string, maxPages = 20): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await hevyGet<Record<string, unknown> & { page_count?: number }>(path, {
      page,
      pageSize: PAGE_SIZE,
    });
    const items = (data[key] as T[] | undefined) ?? [];
    out.push(...items);
    if (!items.length || !data.page_count || page >= data.page_count) break;
  }
  return out;
}

export function getRoutines() {
  return allPages<HevyRoutine>("/routines", "routines");
}

export function getRoutineFolders() {
  return allPages<HevyFolder>("/routine_folders", "routine_folders");
}

/** Workouts that started on or after `sinceDay` (local), newest first. */
export async function getWorkoutsSince(sinceDay: string, maxPages = 15): Promise<HevyWorkout[]> {
  const out: HevyWorkout[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await hevyGet<{ workouts?: HevyWorkout[]; page_count?: number }>("/workouts", {
      page,
      pageSize: PAGE_SIZE,
    });
    const items = data.workouts ?? [];
    out.push(...items.filter((w) => localDay(w.start_time) >= sinceDay));
    // Pages are newest first; stop once a page reaches past the window.
    const oldest = items.at(-1);
    if (!items.length || !data.page_count || page >= data.page_count) break;
    if (oldest && localDay(oldest.start_time) < addDays(sinceDay, -1)) break;
  }
  return out.sort((a, b) => b.start_time.localeCompare(a.start_time));
}

export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
  const rows = await allPages<BodyMeasurement>("/body_measurements", "body_measurements");
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}
