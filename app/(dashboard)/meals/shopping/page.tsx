import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { navBtn, SetupNote } from "@/components/dashboard";
import { ShoppingList } from "@/components/meals/shopping-list";
import { attempt } from "@/lib/attempt";
import { addDays, formatDay, isDay, today, weekStart } from "@/lib/dates";
import { loadLibrary, loadPlan, loadShoppingState, shoppingList } from "@/lib/meals";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Shopping List · Life Dashboard" };

export default async function ShoppingPage({ searchParams }: PageProps<"/meals/shopping">) {
  const params = await searchParams;
  const thisWeek = weekStart(today());
  const start = typeof params.week === "string" && isDay(params.week) ? weekStart(params.week) : thisWeek;
  const supabase = await createClient();

  const data = await attempt(async () => {
    const [library, plan, state] = await Promise.all([
      loadLibrary(supabase),
      loadPlan(supabase, start, addDays(start, 6)),
      loadShoppingState(supabase, start),
    ]);
    return { list: shoppingList(plan, new Map(library.map((m) => [m.id, m]))), state, planned: plan.length };
  });

  if (data.error !== null) {
    return (
      <SetupNote title="Meal tables not set up yet">
        Run <code className="font-mono text-xs">supabase/migrations/20260924_meals.sql</code> in the Supabase SQL Editor, then reload. ({data.error})
      </SetupNote>
    );
  }
  const { list, state, planned } = data.data;
  const weekLabel = `${formatDay(start, { day: "numeric", month: "short" })} – ${formatDay(addDays(start, 6), { day: "numeric", month: "short" })}`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={`/meals/shopping?week=${addDays(start, -7)}`} className={navBtn} aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></Link>
        <Link href={`/meals/shopping?week=${addDays(start, 7)}`} className={navBtn} aria-label="Next week"><ChevronRight className="h-4 w-4" /></Link>
        {start !== thisWeek && <Link href="/meals/shopping" className={navBtn}>This week</Link>}
        <h2 className="ml-1 text-base font-semibold">Shopping for {weekLabel}</h2>
      </div>

      {planned === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Nothing planned this week yet. <Link href={`/meals?week=${start}`} className="font-medium text-orange-600 hover:underline">Plan your meals</Link> and the list builds itself.
        </p>
      ) : (
        <div className="max-w-2xl">
          <ShoppingList
            weekStart={start}
            initial={state}
            items={list.items.map((i) => ({ foodId: i.food.id, name: i.food.name, brand: i.food.brand, grams: i.grams, meals: i.meals }))}
          />
          {list.noIngredients.length > 0 && (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Not on the list (typed totals, no ingredients): {list.noIngredients.join(", ")}.
            </p>
          )}
        </div>
      )}
    </>
  );
}
