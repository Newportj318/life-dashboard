"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronLeft, ChevronRight, ListChecks, Plus, Wallet } from "lucide-react";
import { createProject, moveProject } from "@/app/actions/goals";
import { STAGES, dueLabel, nextTask, spent, type Project, type Stage } from "@/lib/goal-types";
import { money } from "@/lib/format";
import { btnPrimary, inputCls } from "@/components/forms";

export function ProjectBoard({ projects, today }: { projects: Project[]; today: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [board, moveOptimistic] = useOptimistic(projects, (list, { id, stage }: { id: string; stage: Stage }) =>
    list.map((p) => (p.id === id ? { ...p, stage } : p))
  );
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const move = (id: string, stage: Stage) =>
    startTransition(async () => {
      moveOptimistic({ id, stage });
      const res = await moveProject(id, stage);
      if (!res.ok) setError(res.error);
      router.refresh();
    });

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    startTransition(async () => {
      const res = await createProject(title, "idea");
      if (!res.ok) return setError(res.error);
      setNewTitle("");
      router.push(`/projects/${res.data.id}`);
    });
  };

  return (
    <>
      <form onSubmit={create} className="mb-5 flex max-w-lg gap-2">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New project, e.g. Garage shelving" className={inputCls} aria-label="New project name" />
        <button className={btnPrimary("sky")}><Plus className="h-4 w-4" /> Add</button>
      </form>
      {error && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-4 xl:overflow-visible">
        {STAGES.map((stage, si) => {
          const items = board.filter((p) => p.stage === stage.key);
          return (
            <section
              key={stage.key}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage.key);
              }}
              onDragLeave={() => setOver((o) => (o === stage.key ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                setOver(null);
                setDragging(null);
                if (id && board.find((p) => p.id === id)?.stage !== stage.key) move(id, stage.key);
              }}
              className={`w-72 shrink-0 snap-start rounded-xl border p-3 transition-colors xl:w-auto ${
                over === stage.key ? "border-sky-400 bg-sky-50/60 dark:bg-sky-900/20" : "border-gray-200 bg-gray-100/60 dark:border-white/[0.08] dark:bg-white/[0.02]"
              }`}
              aria-label={`${stage.label} projects`}
            >
              <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold">
                {stage.label}
                <span className="rounded-full bg-white px-2 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">{items.length}</span>
              </h2>
              <ul className="min-h-16 space-y-2">
                {items.map((p) => {
                  const next = nextTask(p);
                  const doneCount = p.tasks.filter((t) => t.done).length;
                  const cost = spent(p);
                  const due = p.targetDate && p.stage !== "done" ? dueLabel(p.targetDate, today) : null;
                  return (
                    <li
                      key={p.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", p.id);
                        setDragging(p.id);
                      }}
                      onDragEnd={() => setDragging(null)}
                      className={`surface surface-hover rounded-xl p-3 ${dragging === p.id ? "opacity-50" : ""}`}
                    >
                      <Link href={`/projects/${p.id}`} className="block font-medium hover:underline">{p.title}</Link>
                      {next && p.stage !== "done" && (
                        <p className="mt-1 truncate text-xs text-gray-600 dark:text-gray-400" title={next.title}>Next: {next.title}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        {p.tasks.length > 0 && (
                          <span className="inline-flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" /> {doneCount}/{p.tasks.length}</span>
                        )}
                        {(p.budget != null || cost > 0) && (
                          <span className={`inline-flex items-center gap-1 ${p.budget != null && cost > p.budget ? "text-red-600 dark:text-red-400" : ""}`}>
                            <Wallet className="h-3.5 w-3.5" /> {money(cost)}{p.budget != null && ` / ${money(p.budget)}`}
                          </span>
                        )}
                        {due && (
                          <span className={`inline-flex items-center gap-1 ${due.overdue ? "text-red-600 dark:text-red-400" : due.soon ? "text-amber-700 dark:text-amber-400" : ""}`}>
                            <CalendarClock className="h-3.5 w-3.5" /> {due.text}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex justify-end gap-1">
                        <button
                          disabled={si === 0}
                          onClick={() => move(p.id, STAGES[si - 1].key)}
                          className="rounded p-1 text-gray-400 enabled:hover:bg-gray-100 enabled:hover:text-gray-700 disabled:opacity-30 dark:enabled:hover:bg-white/[0.06]"
                          aria-label={si > 0 ? `Move ${p.title} to ${STAGES[si - 1].label}` : undefined}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          disabled={si === STAGES.length - 1}
                          onClick={() => move(p.id, STAGES[si + 1].key)}
                          className="rounded p-1 text-gray-400 enabled:hover:bg-gray-100 enabled:hover:text-gray-700 disabled:opacity-30 dark:enabled:hover:bg-white/[0.06]"
                          aria-label={si < STAGES.length - 1 ? `Move ${p.title} to ${STAGES[si + 1].label}` : undefined}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
