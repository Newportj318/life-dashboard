"use server";

import { revalidatePath } from "next/cache";
import { isDay } from "@/lib/dates";
import { AREAS, STAGES, type GoalStatus, type Milestone, type Stage, type Tracking } from "@/lib/goal-types";
import { createClient } from "@/lib/supabase/server";

export type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };
const fail = (error: string) => ({ ok: false as const, error });
const done = <T,>(data: T) => ({ ok: true as const, data });

const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const id = (v: unknown) => text(v, 64);
const numOrNull = (v: unknown) => {
  if (v === "" || v == null) return null;
  const x = Number(v);
  return Number.isFinite(x) ? Math.max(-1e12, Math.min(1e12, x)) : null;
};
const dayOrNull = (v: unknown) => (isDay(v) ? (v as string) : null);

function refresh() {
  revalidatePath("/goals", "layout");
  revalidatePath("/projects", "layout");
  revalidatePath("/");
}

// ---------- Goals ----------

export type GoalInput = {
  id?: string;
  title: string;
  area: string;
  status: GoalStatus;
  tracking: Tracking;
  unit: string;
  startValue: number | string | null;
  targetValue: number | string | null;
  currentValue: number | string | null;
  deadline: string | null;
  notes: string;
  milestones: Milestone[];
};

const STATUSES: GoalStatus[] = ["current", "future", "achieved", "dropped"];
const TRACKINGS: Tracking[] = ["manual", "net_worth", "milestones"];

export async function saveGoal(input: GoalInput): Promise<Result<{ id: string }>> {
  const title = text(input.title, 160);
  if (!title) return fail("Give the goal a name.");
  const status = STATUSES.includes(input.status) ? input.status : "current";
  const tracking = TRACKINGS.includes(input.tracking) ? input.tracking : "manual";
  const row = {
    title,
    area: AREAS.some((a) => a.key === input.area) ? input.area : "personal",
    status,
    tracking,
    unit: tracking === "net_worth" ? "$" : text(input.unit, 20) || null,
    start_value: numOrNull(input.startValue),
    target_value: numOrNull(input.targetValue),
    current_value: tracking === "manual" ? numOrNull(input.currentValue) : null,
    deadline: dayOrNull(input.deadline),
    notes: text(input.notes, 4000) || null,
    achieved_at: status === "achieved" ? new Date().toISOString() : null,
  };

  const supabase = await createClient();
  const saved = input.id
    ? await supabase.from("goals").update(row).eq("id", id(input.id)).select("id").single()
    : await supabase.from("goals").insert(row).select("id").single();
  if (saved.error) return fail(saved.error.message);
  const goalId = saved.data.id as string;

  const cleared = await supabase.from("goal_milestones").delete().eq("goal_id", goalId);
  if (cleared.error) return fail(cleared.error.message);
  const milestones = (input.milestones ?? []).filter((m) => text(m.title)).slice(0, 50);
  if (milestones.length) {
    const ins = await supabase.from("goal_milestones").insert(
      milestones.map((m, position) => ({
        goal_id: goalId,
        title: text(m.title, 160),
        value: numOrNull(m.value),
        due: dayOrNull(m.due),
        done: Boolean(m.done),
        position,
      }))
    );
    if (ins.error) return fail(ins.error.message);
  }
  refresh();
  return done({ id: goalId });
}

export async function deleteGoal(goalId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id(goalId));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function setGoalStatus(goalId: string, status: GoalStatus): Promise<Result> {
  if (!STATUSES.includes(status)) return fail("Invalid status.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ status, achieved_at: status === "achieved" ? new Date().toISOString() : null })
    .eq("id", id(goalId));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function updateGoalValue(goalId: string, value: number | string): Promise<Result> {
  const v = numOrNull(value);
  if (v == null) return fail("Enter a number.");
  const supabase = await createClient();
  const { error } = await supabase.from("goals").update({ current_value: v }).eq("id", id(goalId)).eq("tracking", "manual");
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function toggleMilestone(milestoneId: string, isDone: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("goal_milestones").update({ done: isDone }).eq("id", id(milestoneId));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

// ---------- Projects ----------

const isStage = (s: unknown): s is Stage => STAGES.some((x) => x.key === s);

export async function createProject(title: string, stage: Stage = "idea"): Promise<Result<{ id: string }>> {
  const t = text(title, 160);
  if (!t) return fail("Give the project a name.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").insert({ title: t, stage: isStage(stage) ? stage : "idea" }).select("id").single();
  if (error) return fail(error.message);
  refresh();
  return done({ id: data.id as string });
}

export type ProjectInput = {
  title: string;
  stage: Stage;
  goalId: string | null;
  targetDate: string | null;
  budget: number | string | null;
  notes: string;
};

export async function updateProject(projectId: string, input: ProjectInput): Promise<Result> {
  const title = text(input.title, 160);
  if (!title) return fail("Give the project a name.");
  const stage = isStage(input.stage) ? input.stage : "idea";
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      title,
      stage,
      goal_id: input.goalId ? id(input.goalId) : null,
      target_date: dayOrNull(input.targetDate),
      budget: numOrNull(input.budget),
      notes: text(input.notes, 20000) || null,
      completed_at: stage === "done" ? new Date().toISOString() : null,
    })
    .eq("id", id(projectId));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function moveProject(projectId: string, stage: Stage): Promise<Result> {
  if (!isStage(stage)) return fail("Invalid stage.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ stage, completed_at: stage === "done" ? new Date().toISOString() : null })
    .eq("id", id(projectId));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function deleteProject(projectId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id(projectId));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function addTask(projectId: string, title: string, due: string | null): Promise<Result> {
  const t = text(title, 200);
  if (!t) return fail("Enter a task.");
  const supabase = await createClient();
  const { error } = await supabase.from("project_tasks").insert({ project_id: id(projectId), title: t, due: dayOrNull(due) });
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function updateTask(taskId: string, patch: { done?: boolean; due?: string | null; title?: string }): Promise<Result> {
  const row: Record<string, unknown> = {};
  if (patch.done !== undefined) row.done = Boolean(patch.done);
  if (patch.due !== undefined) row.due = dayOrNull(patch.due);
  if (patch.title !== undefined) {
    const t = text(patch.title, 200);
    if (!t) return fail("Task can't be empty.");
    row.title = t;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("project_tasks").update(row).eq("id", id(taskId));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function deleteTask(taskId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_tasks").delete().eq("id", id(taskId));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function addCost(projectId: string, description: string, amount: number | string, spentOn: string | null): Promise<Result> {
  const d = text(description, 200);
  const a = numOrNull(amount);
  if (!d || a == null) return fail("Enter what it was and how much.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_costs")
    .insert({ project_id: id(projectId), description: d, amount: a, ...(dayOrNull(spentOn) ? { spent_on: spentOn } : {}) });
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function deleteCost(costId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_costs").delete().eq("id", id(costId));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}
