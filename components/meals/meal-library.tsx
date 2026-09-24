"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { SLOTS, SLOT_LABELS, round, type Macros, type Slot } from "@/lib/meal-types";
import { btnPrimary, inputCls } from "./ui";

type LibraryMeal = { id: string; name: string; slots: Slot[]; servings: number; perServing: Macros; ingredientCount: number };

export function MealLibrary({ meals }: { meals: LibraryMeal[] }) {
  const [q, setQ] = useState("");
  const [slot, setSlot] = useState<Slot | "all">("all");
  const list = meals.filter((m) => (slot === "all" || m.slots.includes(slot)) && m.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search meals" className={`${inputCls} pl-8`} aria-label="Search meals" />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by slot">
          {(["all", ...SLOTS] as const).map((s) => (
            <button
              key={s}
              aria-pressed={slot === s}
              onClick={() => setSlot(s)}
              className={`rounded-full border px-3 py-1 text-sm ${
                slot === s
                  ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06]"
              }`}
            >
              {s === "all" ? "All" : SLOT_LABELS[s]}
            </button>
          ))}
        </div>
        <Link href="/meals/library/new" className={btnPrimary}>
          <Plus className="h-4 w-4" /> New meal
        </Link>
      </div>

      {meals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
          <p className="font-medium">Your meal library is empty</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add meals you eat regularly, then drop them into your week plan.</p>
          <Link href="/meals/library/new" className={`${btnPrimary} mt-4`}>
            <Plus className="h-4 w-4" /> Add your first meal
          </Link>
        </div>
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No meals match.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => {
            const r = round(m.perServing);
            return (
              <li key={m.id}>
                <Link href={`/meals/library/${m.id}`} className="block h-full surface surface-hover p-5">
                  <p className="font-semibold">{m.name}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {m.slots.length ? m.slots.map((s) => SLOT_LABELS[s]).join(", ") : "Any meal"} · makes {m.servings} · {m.ingredientCount ? `${m.ingredientCount} ingredients` : "typed totals"}
                  </p>
                  <p className="mt-3 text-2xl font-bold">
                    {r.kcal.toLocaleString("en-AU")} <span className="text-sm font-medium text-gray-500 dark:text-gray-400">kcal / serve</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">P {r.protein}g · C {r.carbs}g · F {r.fat}g</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
