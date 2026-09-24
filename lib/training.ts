import "server-only";
import { addDays, localDay, weekStart } from "@/lib/dates";
import type { HevyFolder, HevyRoutine, HevyWorkout, BodyMeasurement } from "@/lib/hevy";
import { activityMatches, type StravaActivity } from "@/lib/strava";
import type { PlanEntry, RoutineGroup, WeekDay } from "@/lib/training-types";

const minutesBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));

function workoutMatches(w: HevyWorkout, plan: PlanEntry) {
  return w.routine_id ? w.routine_id === plan.routine_id : w.title === plan.label;
}

/** Planned vs done for each day of the week. */
export function buildWeek(
  days: string[],
  plan: PlanEntry[],
  workouts: HevyWorkout[],
  activities: StravaActivity[],
  todayDay: string
): WeekDay[] {
  const planByDay = new Map(plan.map((p) => [p.day, p]));
  const workoutsOn = (d: string) => workouts.filter((w) => localDay(w.start_time) === d);
  const activitiesOn = (d: string) => activities.filter((a) => localDay(a.start_date) === d);

  return days.map((day) => {
    const p = planByDay.get(day) ?? null;
    const dayWorkouts = workoutsOn(day);
    const dayActivities = activitiesOn(day);

    const result: WeekDay = {
      day,
      plan: p,
      status: "unplanned",
      workouts: dayWorkouts.map((w) => ({ id: w.id, title: w.title, minutes: minutesBetween(w.start_time, w.end_time) })),
      activities: dayActivities.map((a) => ({
        id: a.id,
        name: a.name,
        sportType: a.sport_type,
        km: a.distance / 1000,
        minutes: Math.round(a.moving_time / 60),
      })),
    };

    if (!p) return result;
    if (p.kind === "rest") return { ...result, status: "rest" };

    const matchesPlan =
      p.kind === "routine"
        ? (d: string) => workoutsOn(d).some((w) => workoutMatches(w, p))
        : (d: string) => activitiesOn(d).some((a) => activityMatches(p.label, a.sport_type));

    if (matchesPlan(day)) return { ...result, status: "done" };

    // Done on a different day this week, and that day wasn't already planned for it.
    const movedTo = days.find((d) => {
      if (d === day || !matchesPlan(d)) return false;
      const other = planByDay.get(d);
      return !(other && other.kind === p.kind && (other.routine_id ?? other.label) === (p.routine_id ?? p.label));
    });
    if (movedTo) return { ...result, status: "moved", movedTo };

    const status = day < todayDay ? "missed" : day === todayDay ? "today" : "planned";
    return { ...result, status };
  });
}

function workingSets(w: HevyWorkout) {
  return w.exercises.flatMap((e) => e.sets.filter((s) => s.type !== "warmup").map((s) => ({ e, s })));
}

export function weekTotals(week: WeekDay[], workouts: HevyWorkout[], activities: StravaActivity[]) {
  const days = new Set(week.map((d) => d.day));
  const inWeek = workouts.filter((w) => days.has(localDay(w.start_time)));
  const actsInWeek = activities.filter((a) => days.has(localDay(a.start_date)));

  const planned = week.filter((d) => d.plan && d.plan.kind !== "rest");
  const completed = planned.filter((d) => d.status === "done" || d.status === "moved");
  const volumeKg = inWeek.reduce(
    (sum, w) => sum + workingSets(w).reduce((s, { s: set }) => s + (set.weight_kg ?? 0) * (set.reps ?? 0), 0),
    0
  );
  const km = actsInWeek.reduce((s, a) => s + a.distance / 1000, 0);
  const minutes =
    inWeek.reduce((s, w) => s + minutesBetween(w.start_time, w.end_time), 0) +
    actsInWeek.reduce((s, a) => s + Math.round(a.moving_time / 60), 0);

  return {
    planned: planned.length,
    completed: completed.length,
    sessions: inWeek.length + actsInWeek.length,
    volumeKg,
    km,
    minutes,
  };
}

// Estimated one-rep max (Epley). Only sets of 1–12 reps give a sensible estimate.
const e1rm = (kg: number, reps: number) => (reps === 1 ? kg : kg * (1 + reps / 30));

export type LiftProgress = {
  id: string;
  title: string;
  sessions: number;
  bestE1rm: number;
  bestSet: string;
  bestDay: string;
  recentPr: boolean;
  weekly: { week: string; value: number }[];
};

/** The lifts you do most, with best estimated 1RM and a weekly trend. */
export function strengthProgress(workouts: HevyWorkout[], todayDay: string, limit = 6): LiftProgress[] {
  const lifts = new Map<
    string,
    { title: string; sessions: Set<string>; weekly: Map<string, number>; best: { v: number; set: string; day: string } }
  >();

  for (const w of workouts) {
    const day = localDay(w.start_time);
    for (const e of w.exercises) {
      for (const s of e.sets) {
        if (s.type === "warmup" || !s.weight_kg || !s.reps || s.reps > 12) continue;
        const v = e1rm(s.weight_kg, s.reps);
        const lift = lifts.get(e.exercise_template_id) ?? {
          title: e.title,
          sessions: new Set(),
          weekly: new Map(),
          best: { v: 0, set: "", day: "" },
        };
        lift.sessions.add(w.id);
        const wk = weekStart(day);
        lift.weekly.set(wk, Math.max(lift.weekly.get(wk) ?? 0, v));
        if (v > lift.best.v) lift.best = { v, set: `${s.weight_kg}kg × ${s.reps}`, day };
        lifts.set(e.exercise_template_id, lift);
      }
    }
  }

  return [...lifts.entries()]
    .map(([id, l]) => ({
      id,
      title: l.title,
      sessions: l.sessions.size,
      bestE1rm: Math.round(l.best.v * 10) / 10,
      bestSet: l.best.set,
      bestDay: l.best.day,
      recentPr: l.best.day >= addDays(todayDay, -14),
      weekly: [...l.weekly.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, value]) => ({ week, value: Math.round(value * 10) / 10 })),
    }))
    .sort((a, b) => b.sessions - a.sessions || b.bestE1rm - a.bestE1rm)
    .slice(0, limit);
}

/** Distance per week (km) for the weeks starting at each of `weeks`. */
export function weeklyDistance(activities: StravaActivity[], weeks: string[]) {
  const totals = new Map(weeks.map((w) => [w, 0]));
  for (const a of activities) {
    const wk = weekStart(localDay(a.start_date));
    if (totals.has(wk)) totals.set(wk, totals.get(wk)! + a.distance / 1000);
  }
  return weeks.map((week) => ({ week, value: Math.round(totals.get(week)! * 10) / 10 }));
}

export function formatPace(a: StravaActivity) {
  if (!a.average_speed || !a.distance) return "—";
  if (["Run", "TrailRun", "VirtualRun", "Walk", "Hike"].includes(a.sport_type)) {
    const secPerKm = 1000 / a.average_speed;
    const m = Math.floor(secPerKm / 60);
    const s = Math.round(secPerKm % 60);
    return `${m}:${String(s).padStart(2, "0")} /km`;
  }
  return `${(a.average_speed * 3.6).toFixed(1)} km/h`;
}

export function bodyweightSeries(rows: BodyMeasurement[]) {
  return rows
    .filter((r) => typeof r.weight_kg === "number")
    .map((r) => ({ day: r.date, value: r.weight_kg as number }));
}

/** Routines grouped by Hevy folder, folders in Hevy's order, loose routines last. */
export function groupRoutines(routines: HevyRoutine[], folders: HevyFolder[]): RoutineGroup[] {
  const sorted = [...folders].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const groups: RoutineGroup[] = sorted.map((f) => ({
    folder: f.title,
    routines: routines
      .filter((r) => r.folder_id === f.id)
      .map((r) => ({ id: r.id, title: r.title }))
      .sort((a, b) => a.title.localeCompare(b.title)),
  }));
  const known = new Set(folders.map((f) => f.id));
  const loose = routines.filter((r) => !r.folder_id || !known.has(r.folder_id));
  if (loose.length) {
    groups.push({
      folder: "Other routines",
      routines: loose.map((r) => ({ id: r.id, title: r.title })).sort((a, b) => a.title.localeCompare(b.title)),
    });
  }
  return groups.filter((g) => g.routines.length);
}
