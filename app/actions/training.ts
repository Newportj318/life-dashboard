"use server";

import { revalidatePath } from "next/cache";
import { addDays, isDay } from "@/lib/dates";
import { disconnectStrava as removeStrava } from "@/lib/strava";
import { createClient } from "@/lib/supabase/server";
import { CARDIO_TYPES, type PlanEntry } from "@/lib/training-types";

export type SaveResult = { ok: true } | { ok: false; error: string };

/** Replaces the plan for the 7 days starting at `start`. Days missing from `entries` are cleared. */
export async function saveWeekPlan(start: string, entries: PlanEntry[]): Promise<SaveResult> {
  if (!isDay(start)) return { ok: false, error: "Invalid week." };
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const clean: PlanEntry[] = [];
  for (const e of entries) {
    if (!days.includes(e.day)) return { ok: false, error: "A day is outside this week." };
    const label = String(e.label ?? "").slice(0, 120).trim();
    if (e.kind === "rest") clean.push({ day: e.day, kind: "rest", routine_id: null, label: "Rest" });
    else if (e.kind === "cardio" && (CARDIO_TYPES as readonly string[]).includes(label))
      clean.push({ day: e.day, kind: "cardio", routine_id: null, label });
    else if (e.kind === "routine" && e.routine_id && label)
      clean.push({ day: e.day, kind: "routine", routine_id: String(e.routine_id).slice(0, 64), label });
    else return { ok: false, error: "One of the days has an invalid session." };
  }

  const supabase = await createClient();
  const cleared = days.filter((d) => !clean.some((e) => e.day === d));

  if (cleared.length) {
    const { error } = await supabase.from("training_plan").delete().in("day", cleared);
    if (error) return { ok: false, error: error.message };
  }
  if (clean.length) {
    const { error } = await supabase
      .from("training_plan")
      .upsert(clean.map((e) => ({ ...e, updated_at: new Date().toISOString() })), { onConflict: "user_id,day" });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/training");
  revalidatePath("/");
  return { ok: true };
}

export async function disconnectStrava() {
  await removeStrava();
  revalidatePath("/training");
  revalidatePath("/settings");
}
