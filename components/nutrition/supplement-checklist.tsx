"use client";

import { useOptimistic, useTransition } from "react";
import { Circle, CircleCheck } from "lucide-react";
import { setSupplementTaken } from "@/app/actions/meals";
import { SUPPLEMENT_TIMES, type Supplement } from "@/lib/meal-types";

/** Today's supplements grouped by time of day; tap to tick. */
export function SupplementChecklist({ day, supplements, taken, compact = false }: { day: string; supplements: Supplement[]; taken: string[]; compact?: boolean }) {
  const [, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(new Set(taken), (s, { id, on }: { id: string; on: boolean }) => {
    const next = new Set(s);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  });

  const active = supplements.filter((s) => s.active);
  if (!active.length) return <p className="text-sm text-gray-500 dark:text-gray-400">No supplements set up yet.</p>;

  const toggle = (id: string) =>
    startTransition(async () => {
      const on = !done.has(id);
      setDone({ id, on });
      await setSupplementTaken(day, id, on);
    });

  const groups = SUPPLEMENT_TIMES.map((t) => ({ ...t, items: active.filter((s) => s.time === t.key) })).filter((g) => g.items.length);

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {groups.map((g) => (
        <div key={g.key}>
          {!compact && <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{g.label}</h3>}
          <ul className="space-y-1">
            {g.items.map((s) => {
              const on = done.has(s.id);
              return (
                <li key={s.id}>
                  <button onClick={() => toggle(s.id)} aria-pressed={on} className="flex w-full items-center gap-3 rounded-md px-1 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.06]">
                    {on ? <CircleCheck className="h-4 w-4 shrink-0 text-green-500" /> : <Circle className="h-4 w-4 shrink-0 text-gray-400" />}
                    <span className={`text-sm font-medium ${on ? "text-gray-400 line-through dark:text-gray-500" : ""}`}>{s.name}</span>
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{compact ? g.label : s.dose}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
