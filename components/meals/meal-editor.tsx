"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, X } from "lucide-react";
import { deleteMeal, saveMeal, searchFoods } from "@/app/actions/meals";
import {
  SLOTS,
  SLOT_LABELS,
  ZERO,
  itemMacros,
  macroLine,
  perServing,
  round,
  type Food,
  type FoodDraft,
  type Macros,
  type Meal,
  type Slot,
} from "@/lib/meal-types";
import { btnGhost, btnPrimary, btnSecondary, inputCls } from "./ui";

type Item = { key: string; food: FoodDraft; grams: number };
let nextKey = 0;
const key = () => `i${nextKey++}`;

export function MealEditor({ meal }: { meal?: Meal }) {
  const router = useRouter();
  const [name, setName] = useState(meal?.name ?? "");
  const [slots, setSlots] = useState<Slot[]>(meal?.slots ?? []);
  const [servings, setServings] = useState(meal?.servings ?? 1);
  const [notes, setNotes] = useState(meal?.notes ?? "");
  const [items, setItems] = useState<Item[]>(meal?.items.map((i) => ({ key: key(), food: i.food, grams: i.grams })) ?? []);
  const [extra, setExtra] = useState<Macros>(meal?.extra ?? ZERO);
  const [showExtra, setShowExtra] = useState(Boolean(meal && (meal.extra.kcal || meal.extra.protein || meal.extra.carbs || meal.extra.fat)));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const preview = perServing({ servings: servings || 1, extra, items });

  const save = () =>
    startTransition(async () => {
      const res = await saveMeal({
        id: meal?.id,
        name,
        slots,
        servings,
        notes,
        extra: showExtra ? extra : ZERO,
        items: items.map((i) => ({ food: i.food, grams: i.grams })),
      });
      if (!res.ok) return setError(res.error);
      router.push("/meals/library");
      router.refresh();
    });

  const remove = () => {
    if (!meal || !confirm(`Delete "${meal.name}"? It will also be removed from any planned days.`)) return;
    startTransition(async () => {
      const res = await deleteMeal(meal.id);
      if (!res.ok) return setError(res.error);
      router.push("/meals/library");
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-medium">Meal name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken burrito bowl" className={inputCls} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Recipe makes (serves)</span>
              <input type="number" min={0.25} step={0.25} value={servings} onChange={(e) => setServings(Number(e.target.value))} className={inputCls} />
            </label>
          </div>
          <fieldset className="mt-4">
            <legend className="mb-1.5 text-sm font-medium">Good for</legend>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map((s) => {
                const on = slots.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSlots((prev) => (on ? prev.filter((x) => x !== s) : [...prev, s]))}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      on
                        ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    {SLOT_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Ingredients</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">For the whole recipe. Amounts are in grams (use ml for liquids like milk).</p>

          {items.length > 0 && (
            <ul className="mb-4 divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((i) => (
                <li key={i.key} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={i.food.name}>{i.food.name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {[i.food.brand, macroLine(itemMacros(i))].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <label className="flex shrink-0 items-center gap-1 text-sm">
                    <input
                      type="number"
                      min={0}
                      value={i.grams}
                      onChange={(e) => setItems((prev) => prev.map((x) => (x.key === i.key ? { ...x, grams: Number(e.target.value) } : x)))}
                      className={`${inputCls} w-20 text-right`}
                      aria-label={`Grams of ${i.food.name}`}
                    />
                    g
                  </label>
                  <button onClick={() => setItems((prev) => prev.filter((x) => x.key !== i.key))} className="rounded p-1 text-gray-400 hover:text-red-600" aria-label={`Remove ${i.food.name}`}>
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <FoodSearch onAdd={(food) => setItems((prev) => [...prev, { key: key(), food, grams: food.serving_g ?? 100 }])} />

          <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">
            {!showExtra ? (
              <button onClick={() => setShowExtra(true)} className="text-sm font-medium text-orange-600 hover:underline">
                + Add typed totals (café meal, or anything without ingredients)
              </button>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Typed totals per serve</h3>
                  <button onClick={() => { setShowExtra(false); setExtra(ZERO); }} className="text-xs text-gray-500 hover:text-red-600">Remove</button>
                </div>
                <MacroInputs value={extra} onChange={setExtra} />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Added on top of any ingredients. These don&apos;t appear on the shopping list.</p>
              </>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Notes / method</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={inputCls} placeholder="Optional" />
          </label>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">Per serve</h2>
          <p className="mt-1 text-3xl font-bold">{round(preview).kcal.toLocaleString("en-AU")} kcal</p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {(["protein", "carbs", "fat"] as const).map((k) => (
              <div key={k} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2">
                <dt className="text-xs capitalize text-gray-500 dark:text-gray-400">{k}</dt>
                <dd className="text-base font-semibold">{round(preview)[k]}g</dd>
              </div>
            ))}
          </dl>
          {servings > 1 && <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Whole recipe: {macroLine({ kcal: preview.kcal * servings, protein: preview.protein * servings, carbs: preview.carbs * servings, fat: preview.fat * servings })}</p>}
        </section>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button onClick={save} disabled={pending} className={`${btnPrimary} flex-1`}>{pending ? "Saving…" : "Save meal"}</button>
          <button onClick={() => router.push("/meals/library")} className={btnGhost}>Cancel</button>
        </div>
        {meal && (
          <button onClick={remove} disabled={pending} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" /> Delete meal
          </button>
        )}
      </aside>
    </div>
  );
}

function MacroInputs({ value, onChange }: { value: Macros; onChange: (m: Macros) => void }) {
  const fields: [keyof Macros, string][] = [["kcal", "kcal"], ["protein", "Protein g"], ["carbs", "Carbs g"], ["fat", "Fat g"]];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {fields.map(([k, label]) => (
        <label key={k} className="text-sm">
          <span className="mb-1 block text-gray-600 dark:text-gray-400">{label}</span>
          <input type="number" min={0} step="any" value={value[k] || ""} onChange={(e) => onChange({ ...value, [k]: Number(e.target.value) })} className={inputCls} />
        </label>
      ))}
    </div>
  );
}

function FoodSearch({ onAdd }: { onAdd: (food: FoodDraft) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ saved: Food[]; found: FoodDraft[] } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState<FoodDraft | null>(null);
  const seq = useRef(0);

  // Debounced search; ignore responses to older queries.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const id = ++seq.current;
    const t = setTimeout(async () => {
      setStatus("loading");
      const res = await searchFoods(term);
      if (id !== seq.current) return;
      if (res.ok) {
        setResults(res.data);
        setStatus("idle");
      } else {
        setError(res.error);
        setStatus("error");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const pick = (f: FoodDraft) => {
    onAdd(f);
    setQ("");
    setResults(null);
  };

  const showResults = q.trim().length >= 2 && results;

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods, e.g. chicken breast, Coles rolled oats" className={`${inputCls} pl-8`} aria-label="Search foods" />
      </div>
      {status === "loading" && <p className="mt-2 text-xs text-gray-500">Searching…</p>}
      {status === "error" && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {showResults && (
        <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800">
          {results.saved.length > 0 && <ResultGroup title="Your foods" foods={results.saved} onPick={pick} />}
          {results.found.length > 0 && <ResultGroup title="Open Food Facts" foods={results.found} onPick={pick} />}
          {!results.saved.length && !results.found.length && <p className="p-3 text-sm text-gray-500">No matches. Add it manually below.</p>}
        </div>
      )}

      {!manual ? (
        <button
          onClick={() => setManual({ name: q.trim(), brand: null, off_code: null, kcal: 0, protein: 0, carbs: 0, fat: 0, serving_g: null })}
          className="mt-3 text-sm font-medium text-orange-600 hover:underline"
        >
          + Add a food manually (from the packet)
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-gray-600 dark:text-gray-400">Food name</span>
              <input value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} className={inputCls} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-gray-600 dark:text-gray-400">Brand (optional)</span>
              <input value={manual.brand ?? ""} onChange={(e) => setManual({ ...manual, brand: e.target.value || null })} className={inputCls} />
            </label>
          </div>
          <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Per 100 g</p>
          <MacroInputs value={manual} onChange={(m) => setManual({ ...manual, ...m })} />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setManual(null)} className={btnGhost}>Cancel</button>
            <button onClick={() => { if (manual.name.trim()) { pick(manual); setManual(null); } }} className={btnSecondary}>Add ingredient</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, foods, onPick }: { title: string; foods: FoodDraft[]; onPick: (f: FoodDraft) => void }) {
  return (
    <div>
      <p className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {foods.map((f, i) => (
          <li key={f.id ?? f.off_code ?? i}>
            <button onClick={() => onPick(f)} className="w-full px-3 py-2 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20">
              <p className="truncate text-sm font-medium">
                {f.name}
                {f.brand && <span className="font-normal text-gray-500 dark:text-gray-400"> · {f.brand}</span>}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Per 100 g: {Math.round(Number(f.kcal))} kcal · P {Number(f.protein).toFixed(1)} · C {Number(f.carbs).toFixed(1)} · F {Number(f.fat).toFixed(1)}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
