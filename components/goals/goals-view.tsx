"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarClock, CircleCheck, Circle, Pencil, Plus, Trophy } from "lucide-react";
import { setGoalStatus, toggleMilestone, updateGoalValue } from "@/app/actions/goals";
import { AREAS, areaLabel, dueLabel, formatValue, milestoneDone, type GoalView } from "@/lib/goal-types";
import { btnGhost, btnPrimary, inputCls } from "@/components/forms";

export function GoalsView({ goals, today }: { goals: GoalView[]; today: string }) {
  const [area, setArea] = useState<string>("all");
  const shown = goals.filter((g) => area === "all" || g.area === area);
  const current = shown.filter((g) => g.status === "current");
  const future = shown.filter((g) => g.status === "future");
  const achieved = shown.filter((g) => g.status === "achieved");
  const usedAreas = new Set(goals.map((g) => g.area));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap gap-1.5" role="group" aria-label="Filter by life area">
          {[{ key: "all", label: "All" }, ...AREAS.filter((a) => usedAreas.has(a.key))].map((a) => (
            <button
              key={a.key}
              aria-pressed={area === a.key}
              onClick={() => setArea(a.key)}
              className={`rounded-full border px-3 py-1 text-sm ${
                area === a.key
                  ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <Link href="/goals/new" className={btnPrimary("amber")}>
          <Plus className="h-4 w-4" /> New goal
        </Link>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
          <p className="font-medium">No goals yet</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add what you&apos;re working towards now, and ideas for later.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Current ({current.length})</h2>
            {current.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No current goals{area !== "all" ? ` in ${areaLabel(area)}` : ""}.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {current.map((g) => <GoalCard key={g.id} goal={g} today={today} />)}
              </div>
            )}
          </section>

          {future.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Future ({future.length})</h2>
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
                {future.map((g) => <FutureRow key={g.id} goal={g} />)}
              </ul>
            </section>
          )}

          {achieved.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Achieved ({achieved.length})</summary>
              <ul className="mt-3 space-y-2">
                {achieved.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <Link href={`/goals/${g.id}`} className="hover:underline">{g.title}</Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{areaLabel(g.area)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </>
  );
}

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setError(res.ok ? null : res.error ?? "Something went wrong");
      if (res.ok) router.refresh();
    });
  return { pending, error, run };
}

function GoalCard({ goal: g, today }: { goal: GoalView; today: string }) {
  const { pending, error, run } = useAction();
  const [value, setValue] = useState("");
  const pct = g.progress == null ? null : Math.round(g.progress * 100);
  const due = g.deadline ? dueLabel(g.deadline, today) : null;

  return (
    <article className={`flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm ${pending ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">{areaLabel(g.area)}</p>
          <h3 className="mt-0.5 font-semibold">{g.title}</h3>
        </div>
        <Link href={`/goals/${g.id}`} className={btnGhost} aria-label={`Edit ${g.title}`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </div>

      {pct != null && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="tabular-nums">
              {g.tracking === "milestones" ? (
                `${g.milestones.filter((m) => m.done).length} of ${g.milestones.length} milestones`
              ) : (
                <>
                  <span className="font-semibold">{formatValue(g.value, g.unit)}</span>
                  <span className="text-gray-500 dark:text-gray-400"> of {formatValue(g.targetValue, g.unit)}</span>
                </>
              )}
            </span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700" role="img" aria-label={`${pct}% of the way`}>
            <div className="h-2 rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      {pct == null && g.tracking !== "milestones" && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {g.tracking === "net_worth" && g.value == null ? "Waiting on PocketSmith." : "Set a target to track progress."}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {g.tracking === "net_worth" && <span>Live from PocketSmith</span>}
        {due && (
          <span className={`inline-flex items-center gap-1 ${due.overdue ? "text-red-600 dark:text-red-400" : due.soon ? "text-amber-700 dark:text-amber-400" : ""}`}>
            <CalendarClock className="h-3.5 w-3.5" /> {due.text}
          </span>
        )}
      </div>

      {g.milestones.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-gray-100 pt-3 dark:border-gray-800">
          {g.milestones.map((m) => {
            const isDone = milestoneDone(m, g, g.value);
            const auto = m.value != null && g.tracking !== "milestones";
            return (
              <li key={m.id}>
                <button
                  disabled={auto || pending}
                  onClick={() => m.id && run(() => toggleMilestone(m.id!, !m.done))}
                  className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-sm enabled:hover:bg-gray-50 dark:enabled:hover:bg-gray-800"
                  title={auto ? "Ticks itself when the goal reaches this value" : undefined}
                >
                  {isDone ? <CircleCheck className="h-4 w-4 shrink-0 text-green-500" /> : <Circle className="h-4 w-4 shrink-0 text-gray-400" />}
                  <span className={isDone ? "text-gray-400 line-through dark:text-gray-500" : ""}>{m.title}</span>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {m.value != null ? formatValue(m.value, g.unit) : m.due ? dueLabel(m.due, today).text : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {g.tracking === "manual" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (value.trim()) run(() => updateGoalValue(g.id, value));
              setValue("");
            }}
            className="flex items-center gap-1.5"
          >
            <input value={value} onChange={(e) => setValue(e.target.value)} type="number" step="any" placeholder={`Update${g.unit ? ` (${g.unit})` : ""}`} className={`${inputCls} w-32`} aria-label={`New value for ${g.title}`} />
            <button className={btnGhost} disabled={pending}>Save</button>
          </form>
        )}
        {g.reached && (
          <button onClick={() => run(() => setGoalStatus(g.id, "achieved"))} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
            <Trophy className="h-4 w-4" /> Mark achieved
          </button>
        )}
        <button onClick={() => run(() => setGoalStatus(g.id, "future"))} className={`${btnGhost} ml-auto text-xs`}>Move to future</button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </article>
  );
}

function FutureRow({ goal: g }: { goal: GoalView }) {
  const { pending, run } = useAction();
  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${pending ? "opacity-70" : ""}`}>
      <div className="min-w-0 flex-1">
        <Link href={`/goals/${g.id}`} className="block truncate text-sm font-medium hover:underline">{g.title}</Link>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {areaLabel(g.area)}
          {g.targetValue != null && ` · target ${formatValue(g.targetValue, g.unit)}`}
        </p>
      </div>
      <button onClick={() => run(() => setGoalStatus(g.id, "current"))} className={btnGhost}>
        <ArrowUpRight className="h-4 w-4" /> Make current
      </button>
    </li>
  );
}
