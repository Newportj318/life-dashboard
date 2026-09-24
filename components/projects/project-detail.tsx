"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Circle, CircleCheck, Plus, Trash2, X } from "lucide-react";
import { addCost, addTask, deleteCost, deleteProject, deleteTask, updateProject, updateTask } from "@/app/actions/goals";
import { STAGES, dueLabel, spent, type Project, type Stage } from "@/lib/goal-types";
import { money } from "@/lib/format";
import { Field, btnGhost, btnPrimary, btnSecondary, inputCls } from "@/components/forms";

type GoalOption = { id: string; title: string };

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      setError(res.ok ? null : res.error ?? "Something went wrong");
      if (res.ok) {
        after?.();
        router.refresh();
      }
    });
  return { pending, error, run };
}

const card = "surface p-6";

export function ProjectDetail({ project: p, goals, today }: { project: Project; goals: GoalOption[]; today: string }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
      <div className="space-y-6 xl:col-span-2">
        <Details project={p} goals={goals} />
        <Tasks project={p} today={today} />
      </div>
      <div className="space-y-6">
        <Costs project={p} today={today} />
      </div>
    </div>
  );
}

function Details({ project: p, goals }: { project: Project; goals: GoalOption[] }) {
  const router = useRouter();
  const { pending, error, run } = useAction();
  const [title, setTitle] = useState(p.title);
  const [stage, setStage] = useState<Stage>(p.stage);
  const [goalId, setGoalId] = useState(p.goalId ?? "");
  const [targetDate, setTargetDate] = useState(p.targetDate ?? "");
  const [budget, setBudget] = useState(p.budget == null ? "" : String(p.budget));
  const [notes, setNotes] = useState(p.notes ?? "");
  const [saved, setSaved] = useState(false);

  const save = () =>
    run(() => updateProject(p.id, { title, stage, goalId: goalId || null, targetDate: targetDate || null, budget, notes }), () => setSaved(true));

  const remove = () => {
    if (!confirm(`Delete "${p.title}" and all its tasks and costs?`)) return;
    run(() => deleteProject(p.id), () => router.push("/projects"));
  };

  return (
    <section className={card}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Project" className="sm:col-span-2">
          <input value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} className={inputCls} />
        </Field>
        <Field label="Stage">
          <select value={stage} onChange={(e) => { setStage(e.target.value as Stage); setSaved(false); }} className={inputCls}>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Target finish">
          <input type="date" value={targetDate} onChange={(e) => { setTargetDate(e.target.value); setSaved(false); }} className={inputCls} />
        </Field>
        <Field label="Budget ($, optional)">
          <input type="number" min={0} step="any" value={budget} onChange={(e) => { setBudget(e.target.value); setSaved(false); }} className={inputCls} />
        </Field>
        <Field label="Linked goal (optional)">
          <select value={goalId} onChange={(e) => { setGoalId(e.target.value); setSaved(false); }} className={inputCls}>
            <option value="">None</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </Field>
        <Field label="Notes (links, parts lists, ideas)" className="sm:col-span-2">
          <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false); }} rows={6} className={inputCls} />
        </Field>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={save} disabled={pending} className={btnPrimary("sky")}>{pending ? "Saving…" : "Save details"}</button>
        {saved && <span role="status" className="text-sm text-gray-500 dark:text-gray-400">Saved.</span>}
        <button onClick={remove} disabled={pending} className="ml-auto inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600">
          <Trash2 className="h-4 w-4" /> Delete project
        </button>
      </div>
    </section>
  );
}

function Tasks({ project: p, today }: { project: Project; today: string }) {
  const { pending, error, run } = useAction();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const open = p.tasks.filter((t) => !t.done);
  const done = p.tasks.filter((t) => t.done);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    run(() => addTask(p.id, title, due || null), () => { setTitle(""); setDue(""); });
  };

  const row = (t: Project["tasks"][number]) => {
    const d = t.due && !t.done ? dueLabel(t.due, today) : null;
    return (
      <li key={t.id} className="flex items-center gap-3 py-2">
        <button onClick={() => run(() => updateTask(t.id, { done: !t.done }))} aria-pressed={t.done} aria-label={`${t.done ? "Reopen" : "Complete"} ${t.title}`}>
          {t.done ? <CircleCheck className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-gray-400 hover:text-sky-600" />}
        </button>
        <span className={`min-w-0 flex-1 text-sm ${t.done ? "text-gray-400 line-through dark:text-gray-500" : ""}`}>{t.title}</span>
        {d && (
          <span className={`inline-flex shrink-0 items-center gap-1 text-xs ${d.overdue ? "text-red-600 dark:text-red-400" : d.soon ? "text-amber-700 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}`}>
            <CalendarClock className="h-3.5 w-3.5" /> {d.text}
          </span>
        )}
        {!t.done && (
          <input
            type="date"
            value={t.due ?? ""}
            onChange={(e) => run(() => updateTask(t.id, { due: e.target.value || null }))}
            className="w-9 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0 text-transparent [&::-webkit-calendar-picker-indicator]:opacity-60"
            aria-label={`Due date for ${t.title}`}
            title="Set due date"
          />
        )}
        <button onClick={() => run(() => deleteTask(t.id))} className="rounded p-1 text-gray-400 hover:text-red-600" aria-label={`Delete ${t.title}`}>
          <X className="h-4 w-4" />
        </button>
      </li>
    );
  };

  return (
    <section className={`${card} ${pending ? "opacity-80" : ""}`}>
      <h2 className="mb-3 text-lg font-semibold">Tasks <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{done.length}/{p.tasks.length} done</span></h2>
      <form onSubmit={add} className="mb-3 flex flex-wrap gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task" className={`${inputCls} min-w-40 flex-1`} aria-label="New task" />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={`${inputCls} w-40`} aria-label="Due date (optional)" />
        <button className={btnSecondary} disabled={pending}><Plus className="h-4 w-4" /> Add</button>
      </form>
      {error && <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {p.tasks.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No tasks yet. Break the project into steps.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">{open.map(row)}</ul>
          {done.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">Completed ({done.length})</summary>
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">{done.map(row)}</ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}

function Costs({ project: p, today }: { project: Project; today: string }) {
  const { pending, error, run } = useAction();
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const total = spent(p);
  const pct = p.budget ? Math.round((total / p.budget) * 100) : null;
  const over = p.budget != null && total > p.budget;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => addCost(p.id, desc, amount, date), () => { setDesc(""); setAmount(""); });
  };

  return (
    <section className={`${card} ${pending ? "opacity-80" : ""}`}>
      <h2 className="text-lg font-semibold">Costs</h2>
      <p className="mt-2 text-2xl font-bold">{money(total, { cents: true })}</p>
      <p className={`text-sm ${over ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
        {p.budget != null ? `${over ? "Over" : "of"} ${money(p.budget)} budget${pct != null ? ` (${pct}%)` : ""}` : "No budget set"}
      </p>
      {pct != null && (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10" role="img" aria-label={`${pct}% of budget spent`}>
          <div className={`bar-fill h-2 rounded-full ${over ? "bg-red-500" : "bg-sky-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      )}

      <form onSubmit={add} className="mt-5 space-y-2">
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What for, e.g. Suspension kit" className={inputCls} aria-label="Cost description" />
        <div className="flex gap-2">
          <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$" className={inputCls} aria-label="Amount" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} aria-label="Date" />
        </div>
        <button className={`${btnSecondary} w-full`} disabled={pending}><Plus className="h-4 w-4" /> Add cost</button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {p.costs.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 dark:divide-white/[0.06]">
          {p.costs.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate">{c.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(`${c.spentOn}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <span className="shrink-0 tabular-nums">{money(c.amount, { cents: true })}</span>
              <button onClick={() => run(() => deleteCost(c.id))} className={btnGhost} aria-label={`Delete ${c.description}`}><X className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
