"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { deleteGoal, saveGoal } from "@/app/actions/goals";
import { AREAS, TRACKING_LABELS, type Goal, type GoalStatus, type Milestone, type Tracking } from "@/lib/goal-types";
import { Field, btnGhost, btnPrimary, btnSecondary, inputCls } from "@/components/forms";

const numStr = (v: number | null) => (v == null ? "" : String(v));

export function GoalEditor({ goal, netWorth }: { goal?: Goal; netWorth: number | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [area, setArea] = useState<string>(goal?.area ?? "personal");
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? "current");
  const [tracking, setTracking] = useState<Tracking>(goal?.tracking ?? "manual");
  const [unit, setUnit] = useState(goal?.unit ?? "");
  const [start, setStart] = useState(numStr(goal?.startValue ?? null));
  const [target, setTarget] = useState(numStr(goal?.targetValue ?? null));
  const [current, setCurrent] = useState(numStr(goal?.currentValue ?? null));
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [notes, setNotes] = useState(goal?.notes ?? "");
  const [milestones, setMilestones] = useState<Milestone[]>(goal?.milestones ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const numeric = tracking !== "milestones";

  const chooseTracking = (t: Tracking) => {
    setTracking(t);
    // A new net-worth goal starts measuring from today's net worth.
    if (t === "net_worth" && !start && netWorth != null) setStart(String(Math.round(netWorth)));
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveGoal({
        id: goal?.id,
        title,
        area,
        status,
        tracking,
        unit,
        startValue: numeric ? start : null,
        targetValue: numeric ? target : null,
        currentValue: tracking === "manual" ? current : null,
        deadline: deadline || null,
        notes,
        milestones,
      });
      if (!res.ok) return setError(res.error);
      router.push("/goals");
      router.refresh();
    });

  const remove = () => {
    if (!goal || !confirm(`Delete "${goal.title}"?`)) return;
    startTransition(async () => {
      const res = await deleteGoal(goal.id);
      if (!res.ok) return setError(res.error);
      router.push("/goals");
      router.refresh();
    });
  };

  const patchMilestone = (i: number, patch: Partial<Milestone>) => setMilestones((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Goal" className="sm:col-span-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Net worth $600K" className={inputCls} />
          </Field>
          <Field label="Life area">
            <select value={area} onChange={(e) => setArea(e.target.value)} className={inputCls}>
              {AREAS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as GoalStatus)} className={inputCls}>
              <option value="current">Current, working on it now</option>
              <option value="future">Future, an idea for later</option>
              <option value="achieved">Achieved</option>
              <option value="dropped">Dropped</option>
            </select>
          </Field>
          <Field label="Deadline (optional)">
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">How progress is measured</h2>
        <div className="mb-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Tracking">
          {(Object.keys(TRACKING_LABELS) as Tracking[]).map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={tracking === t}
              onClick={() => chooseTracking(t)}
              className={`rounded-full border px-3 py-1 text-sm ${
                tracking === t
                  ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              }`}
            >
              {TRACKING_LABELS[t]}
            </button>
          ))}
        </div>

        {numeric && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {tracking === "manual" && (
              <Field label="Unit">
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, $, km…" className={inputCls} />
              </Field>
            )}
            <Field label="Starting from">
              <input type="number" step="any" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Target">
              <input type="number" step="any" value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls} />
            </Field>
            {tracking === "manual" ? (
              <Field label="Current">
                <input type="number" step="any" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
              </Field>
            ) : (
              <div className="text-sm">
                <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">Current</span>
                <p className="py-1.5">{netWorth != null ? netWorth.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }) : "Connect PocketSmith"}</p>
              </div>
            )}
          </div>
        )}
        {numeric && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Progress runs from the starting value to the target, so a goal to lose weight counts down.</p>}
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Milestones</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {tracking === "milestones" ? "Progress is how many of these are done." : "Optional checkpoints. Give one a value and it ticks itself when you get there."}
        </p>
        {milestones.length > 0 && (
          <ul className="mb-3 space-y-2">
            {milestones.map((m, i) => (
              <li key={m.id ?? `new-${i}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:grid-cols-[auto_2fr_1fr_1fr_auto]">
                <input type="checkbox" checked={m.done} onChange={(e) => patchMilestone(i, { done: e.target.checked })} className="h-4 w-4 accent-amber-600" aria-label="Done" />
                <input value={m.title} onChange={(e) => patchMilestone(i, { title: e.target.value })} placeholder="Milestone" className={inputCls} aria-label="Milestone" />
                <button onClick={() => setMilestones((prev) => prev.filter((_, j) => j !== i))} className="rounded p-1 text-gray-400 hover:text-red-600 sm:order-last" aria-label="Remove milestone">
                  <X className="h-4 w-4" />
                </button>
                {numeric ? (
                  <input type="number" step="any" value={m.value ?? ""} onChange={(e) => patchMilestone(i, { value: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Value" className={`${inputCls} col-start-2 sm:col-start-auto`} aria-label="Value" />
                ) : (
                  <span className="hidden sm:block" />
                )}
                <input type="date" value={m.due ?? ""} onChange={(e) => patchMilestone(i, { due: e.target.value || null })} className={`${inputCls} col-start-2 sm:col-start-auto`} aria-label="Due" />
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => setMilestones((prev) => [...prev, { title: "", value: null, due: null, done: false }])} className={btnSecondary}>
          <Plus className="h-4 w-4" /> Add milestone
        </button>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <Field label="Notes (why this matters, how you'll get there)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={inputCls} />
        </Field>
      </section>

      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={save} disabled={pending} className={btnPrimary("amber")}>{pending ? "Saving…" : "Save goal"}</button>
        <button onClick={() => router.push("/goals")} className={btnGhost}>Cancel</button>
        {goal && (
          <button onClick={remove} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" /> Delete goal
          </button>
        )}
      </div>
    </div>
  );
}
