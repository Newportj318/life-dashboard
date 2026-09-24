import "server-only";
import { attempt } from "@/lib/attempt";
import { summariseAccounts } from "@/lib/finance";
import type { Area, Goal, GoalStatus, Project, Stage, Tracking } from "@/lib/goal-types";
import { getAccounts, pocketsmithConfigured } from "@/lib/pocketsmith";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Row = Record<string, unknown>;

const num = (v: unknown) => (v == null ? null : Number(v));
const str = (v: unknown) => (v == null ? null : String(v));

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function loadGoals(supabase: Supabase): Promise<Goal[]> {
  const [goals, milestones] = await Promise.all([
    supabase.from("goals").select("*").order("position").order("created_at"),
    supabase.from("goal_milestones").select("*").order("position"),
  ]);
  const ms = check(milestones) as Row[];
  return (check(goals) as Row[]).map((g) => ({
    id: g.id as string,
    title: g.title as string,
    area: g.area as Area,
    status: g.status as GoalStatus,
    tracking: g.tracking as Tracking,
    unit: str(g.unit),
    startValue: num(g.start_value),
    targetValue: num(g.target_value),
    currentValue: num(g.current_value),
    deadline: str(g.deadline),
    notes: str(g.notes),
    milestones: ms
      .filter((m) => m.goal_id === g.id)
      .map((m) => ({ id: m.id as string, title: m.title as string, value: num(m.value), due: str(m.due), done: Boolean(m.done) })),
  }));
}

export async function loadProjects(supabase: Supabase): Promise<Project[]> {
  const [projects, tasks, costs] = await Promise.all([
    supabase.from("projects").select("*").order("position").order("created_at"),
    supabase.from("project_tasks").select("*").order("position").order("created_at"),
    supabase.from("project_costs").select("*").order("spent_on", { ascending: false }),
  ]);
  const t = check(tasks) as Row[];
  const c = check(costs) as Row[];
  return (check(projects) as Row[]).map((p) => ({
    id: p.id as string,
    title: p.title as string,
    stage: p.stage as Stage,
    goalId: str(p.goal_id),
    targetDate: str(p.target_date),
    budget: num(p.budget),
    notes: str(p.notes),
    tasks: t.filter((x) => x.project_id === p.id).map((x) => ({ id: x.id as string, title: x.title as string, due: str(x.due), done: Boolean(x.done) })),
    costs: c
      .filter((x) => x.project_id === p.id)
      .map((x) => ({ id: x.id as string, description: x.description as string, amount: Number(x.amount), spentOn: x.spent_on as string })),
  }));
}

/** Live net worth from PocketSmith; null if it isn't connected or fails. */
export async function currentNetWorth() {
  if (!pocketsmithConfigured()) return null;
  const accounts = await attempt(getAccounts);
  return accounts.data ? summariseAccounts(accounts.data).netWorth : null;
}

/** Net worth only when some goal tracks it (saves a PocketSmith call otherwise). */
export async function netWorthForGoals(goals: Goal[]) {
  return goals.some((g) => g.tracking === "net_worth") ? currentNetWorth() : null;
}
