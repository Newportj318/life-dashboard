"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Dumbbell, Moon, Plus, X } from "lucide-react";
import { addToPlan, copyLastWeekMeals, removeFromPlan } from "@/app/actions/meals";
import { SLOTS, SLOT_LABELS, macroLine, round, type DayKind, type Macros, type PlanEntry, type Slot } from "@/lib/meal-types";
import { Modal, btnGhost, btnPrimary, btnSecondary, inputCls } from "./ui";

export type MealSummary = { id: string; name: string; slots: Slot[]; servings: number; perServing: Macros };
export type DayInfo = { day: string; label: string; kind: DayKind; session: string | null; totals: Macros; target: Macros | null };

export function WeekPlan({
  weekStart,
  days,
  entries,
  meals,
  hasLastWeek,
}: {
  weekStart: string;
  days: DayInfo[];
  entries: PlanEntry[];
  meals: MealSummary[];
  hasLastWeek: boolean;
}) {
  const router = useRouter();
  const [picking, setPicking] = useState<{ day: string; slot: Slot } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const byId = useMemo(() => new Map(meals.map((m) => [m.id, m])), [meals]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong");
      else {
        setError(null);
        router.refresh();
      }
    });

  const copyLastWeek = () => {
    if (entries.length && !confirm("Replace this week's meals with last week's?")) return;
    run(() => copyLastWeekMeals(weekStart));
  };

  return (
    <div className={pending ? "opacity-70 transition-opacity" : "transition-opacity"}>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <button onClick={copyLastWeek} disabled={!hasLastWeek || pending} className={btnSecondary} title={hasLastWeek ? undefined : "Last week has no meals planned"}>
          <Copy className="h-4 w-4" /> Copy last week
        </button>
      </div>
      {error && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {days.map((d) => {
          const dayEntries = entries.filter((e) => e.day === d.day);
          const kcalPct = d.target?.kcal ? Math.round((d.totals.kcal / d.target.kcal) * 100) : null;
          return (
            <section key={d.day} className="flex flex-col surface p-4">
              <header className="mb-3">
                <h3 className="text-sm font-semibold">{d.label}</h3>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  {d.kind === "training" ? <Dumbbell className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {d.kind === "training" ? `Training day${d.session ? ` · ${d.session}` : ""}` : "Rest day"}
                </p>
              </header>

              <div className="flex-1 space-y-3">
                {SLOTS.map((slot) => {
                  const slotEntries = dayEntries.filter((e) => e.slot === slot);
                  return (
                    <div key={slot}>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{SLOT_LABELS[slot]}</span>
                        <button
                          onClick={() => setPicking({ day: d.day, slot })}
                          className="rounded p-1 text-gray-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20"
                          aria-label={`Add ${SLOT_LABELS[slot].toLowerCase()} on ${d.label}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {slotEntries.length === 0 ? (
                        <button
                          onClick={() => setPicking({ day: d.day, slot })}
                          className="mt-1 w-full rounded-md border border-dashed border-gray-200 dark:border-white/[0.08] px-2 py-1.5 text-left text-xs text-gray-400 hover:border-orange-300 hover:text-orange-600"
                        >
                          Add meal
                        </button>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {slotEntries.map((e) => {
                            const meal = byId.get(e.mealId);
                            const kcal = meal ? Math.round(meal.perServing.kcal * e.myServings) : 0;
                            return (
                              <li key={e.id} className="group flex items-start gap-2 rounded-md bg-orange-50/60 dark:bg-orange-900/10 px-2 py-1.5">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium" title={meal?.name}>{meal?.name ?? "Deleted meal"}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {kcal} kcal
                                    {e.myServings !== 1 && ` · ${e.myServings} serves`}
                                    {e.servings !== e.myServings && ` · cooking ${e.servings}`}
                                  </p>
                                </div>
                                <button
                                  onClick={() => run(() => removeFromPlan(e.id))}
                                  className="rounded p-0.5 text-gray-400 hover:text-red-600"
                                  aria-label={`Remove ${meal?.name ?? "meal"}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              <footer className="mt-4 border-t border-gray-100 dark:border-white/[0.08] pt-3 text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-sm tabular-nums">{Math.round(d.totals.kcal).toLocaleString("en-AU")} kcal</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {d.target ? `of ${Math.round(d.target.kcal).toLocaleString("en-AU")}${kcalPct !== null ? ` (${kcalPct}%)` : ""}` : "no target set"}
                  </span>
                </div>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  P {round(d.totals).protein}{d.target ? `/${Math.round(d.target.protein)}` : ""}g · C {round(d.totals).carbs}g · F {round(d.totals).fat}g
                </p>
              </footer>
            </section>
          );
        })}
      </div>

      {picking && (
        <MealPicker
          day={days.find((d) => d.day === picking.day)!.label}
          slot={picking.slot}
          meals={meals}
          onClose={() => setPicking(null)}
          onPick={(mealId, servings, myServings) => {
            const { day, slot } = picking;
            setPicking(null);
            run(() => addToPlan(day, slot, mealId, servings, myServings));
          }}
        />
      )}
    </div>
  );
}

function MealPicker({
  day,
  slot,
  meals,
  onClose,
  onPick,
}: {
  day: string;
  slot: Slot;
  meals: MealSummary[];
  onClose: () => void;
  onPick: (mealId: string, servings: number, myServings: number) => void;
}) {
  const [q, setQ] = useState("");
  const [onlySlot, setOnlySlot] = useState(meals.some((m) => m.slots.includes(slot)));
  const [chosen, setChosen] = useState<MealSummary | null>(null);
  const [mine, setMine] = useState(1);
  const [cooking, setCooking] = useState(1);

  const list = meals.filter(
    (m) => (!onlySlot || m.slots.includes(slot)) && m.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  const choose = (m: MealSummary) => {
    setChosen(m);
    setMine(1);
    // Dinner defaults to cooking the whole recipe (family meals); other slots to just your portion.
    setCooking(slot === "dinner" ? m.servings : 1);
  };

  return (
    <Modal title={`${SLOT_LABELS[slot]} · ${day}`} onClose={onClose}>
      {!chosen ? (
        <>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your meals" className={inputCls} />
          <label className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={onlySlot} onChange={(e) => setOnlySlot(e.target.checked)} className="accent-orange-600" />
            Only meals tagged {SLOT_LABELS[slot].toLowerCase()}
          </label>
          {meals.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Your library is empty. <Link href="/meals/library/new" className="font-medium text-orange-600 hover:underline">Add your first meal</Link>.
            </p>
          ) : list.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No meals match.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100 dark:divide-white/[0.06]">
              {list.map((m) => (
                <li key={m.id}>
                  <button onClick={() => choose(m)} className="w-full rounded-md px-2 py-2.5 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{macroLine(m.perServing)} per serve</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link href="/meals/library/new" className="mt-4 inline-block text-sm font-medium text-orange-600 hover:underline">+ New meal</Link>
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="font-medium">{chosen.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {macroLine(chosen.perServing)} per serve · recipe makes {chosen.servings}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-gray-600 dark:text-gray-400">Serves you eat</span>
              <input
                type="number"
                min={0}
                step={0.25}
                value={mine}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMine(v);
                  // Outside dinner you usually cook just your portion; never cook less than you eat.
                  setCooking((c) => (slot === "dinner" ? Math.max(c, v) : v || 1));
                }}
                className={inputCls}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600 dark:text-gray-400">Serves to cook</span>
              <input type="number" min={0.25} step={0.25} value={cooking} onChange={(e) => setCooking(Number(e.target.value))} className={inputCls} />
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your macros count what you eat. The shopping list uses what you cook, so a family dinner cooks every serve while only your portion counts.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setChosen(null)} className={btnGhost}>Back</button>
            <button onClick={() => onPick(chosen.id, cooking || 1, mine)} className={btnPrimary}>Add to {SLOT_LABELS[slot].toLowerCase()}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
