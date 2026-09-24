// Goal and project shapes and progress maths, shared by server pages and the browser.

export const AREAS = [
  { key: "training", label: "Training" },
  { key: "nutrition", label: "Nutrition" },
  { key: "finance", label: "Finance" },
  { key: "career", label: "Career" },
  { key: "personal", label: "Personal" },
  { key: "family", label: "Family" },
  { key: "home", label: "Home" },
] as const;
export type Area = (typeof AREAS)[number]["key"];
export const areaLabel = (a: string) => AREAS.find((x) => x.key === a)?.label ?? a;

export type GoalStatus = "current" | "future" | "achieved" | "dropped";
export type Tracking = "manual" | "net_worth" | "milestones";

export const TRACKING_LABELS: Record<Tracking, string> = {
  manual: "A number I update",
  net_worth: "Net worth (PocketSmith)",
  milestones: "Milestones checklist",
};

export type Milestone = { id?: string; title: string; value: number | null; due: string | null; done: boolean };

export type Goal = {
  id: string;
  title: string;
  area: Area;
  status: GoalStatus;
  tracking: Tracking;
  unit: string | null;
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null; // manual value
  deadline: string | null;
  notes: string | null;
  milestones: Milestone[];
};

/** A goal with its live value and progress worked out. */
export type GoalView = Goal & { value: number | null; progress: number | null; reached: boolean };

/** Up if the target is above the start (save more, lift more), down otherwise (lose weight). */
const goingUp = (g: Pick<Goal, "startValue" | "targetValue">) => (g.targetValue ?? 0) >= (g.startValue ?? 0);

export function milestoneDone(m: Milestone, g: Goal, value: number | null) {
  if (m.done) return true;
  if (m.value == null || value == null) return false;
  return goingUp(g) ? value >= m.value : value <= m.value;
}

export function viewGoal(g: Goal, netWorth: number | null): GoalView {
  if (g.tracking === "milestones") {
    const total = g.milestones.length;
    const done = g.milestones.filter((m) => m.done).length;
    return { ...g, value: null, progress: total ? done / total : null, reached: total > 0 && done === total };
  }
  const value = g.tracking === "net_worth" ? netWorth : g.currentValue;
  if (value == null || g.targetValue == null) return { ...g, value, progress: null, reached: false };
  const start = g.startValue ?? 0;
  const span = g.targetValue - start;
  const progress = span === 0 ? 1 : Math.min(1, Math.max(0, (value - start) / span));
  const reached = goingUp(g) ? value >= g.targetValue : value <= g.targetValue;
  return { ...g, value, progress, reached };
}

export function formatValue(v: number | null, unit: string | null) {
  if (v == null) return "—";
  if (unit === "$") return v.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
  const n = v.toLocaleString("en-AU", { maximumFractionDigits: 2 });
  return unit ? `${n} ${unit}` : n;
}

/** "12 days left", "Due today", "3 days overdue". */
export function dueLabel(due: string, today: string) {
  const days = Math.round((Date.parse(due) - Date.parse(today)) / 86400000);
  if (days === 0) return { text: "Due today", overdue: false, soon: true };
  if (days < 0) return { text: `${-days} day${days === -1 ? "" : "s"} overdue`, overdue: true, soon: false };
  if (days < 60) return { text: `${days} day${days === 1 ? "" : "s"} left`, overdue: false, soon: days <= 7 };
  const months = Math.round(days / 30.4);
  return { text: `${months} months left`, overdue: false, soon: false };
}

// ---------- Projects ----------

export const STAGES = [
  { key: "idea", label: "Idea" },
  { key: "planning", label: "Planning" },
  { key: "active", label: "Active" },
  { key: "done", label: "Done" },
] as const;
export type Stage = (typeof STAGES)[number]["key"];

export type Task = { id: string; title: string; due: string | null; done: boolean };
export type Cost = { id: string; description: string; amount: number; spentOn: string };

export type Project = {
  id: string;
  title: string;
  stage: Stage;
  goalId: string | null;
  targetDate: string | null;
  budget: number | null;
  notes: string | null;
  tasks: Task[];
  costs: Cost[];
};

export const spent = (p: Pick<Project, "costs">) => p.costs.reduce((s, c) => s + c.amount, 0);

/** The next thing to do: the earliest-due open task, else the first open one. */
export function nextTask(p: Pick<Project, "tasks">) {
  const open = p.tasks.filter((t) => !t.done);
  const dated = open.filter((t) => t.due).sort((a, b) => a.due!.localeCompare(b.due!));
  return dated[0] ?? open[0] ?? null;
}
