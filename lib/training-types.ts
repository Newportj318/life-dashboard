// Shapes shared by the server (page, actions) and the browser (planner UI).

export const CARDIO_TYPES = ["Run", "Ride", "Swim", "Walk", "Row", "Cardio"] as const;

export type PlanKind = "routine" | "cardio" | "rest";

export type PlanEntry = {
  day: string; // YYYY-MM-DD
  kind: PlanKind;
  routine_id: string | null;
  label: string;
};

export type DayStatus = "done" | "moved" | "missed" | "today" | "planned" | "rest" | "unplanned";

export type WeekDay = {
  day: string;
  plan: PlanEntry | null;
  status: DayStatus;
  movedTo?: string; // day the planned session was actually done
  workouts: { id: string; title: string; minutes: number }[];
  activities: { id: number; name: string; sportType: string; km: number; minutes: number }[];
};

export type RoutineGroup = { folder: string; routines: { id: string; title: string }[] };
