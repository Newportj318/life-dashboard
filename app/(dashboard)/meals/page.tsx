import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { navBtn, SetupNote } from "@/components/dashboard";
import { WeekPlan, type DayInfo, type MealSummary } from "@/components/meals/week-plan";
import { attempt } from "@/lib/attempt";
import { addDays, formatDay, isDay, today, weekDays, weekStart } from "@/lib/dates";
import { perServing } from "@/lib/meal-types";
import { dayTotals, loadDayKinds, loadLibrary, loadPlan, loadTargets } from "@/lib/meals";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Meal Planning · Life Dashboard" };

export default async function MealPlanPage({ searchParams }: PageProps<"/meals">) {
  const params = await searchParams;
  const thisWeek = weekStart(today());
  const start = typeof params.week === "string" && isDay(params.week) ? weekStart(params.week) : thisWeek;
  const days = weekDays(start);
  const supabase = await createClient();

  const data = await attempt(async () => {
    const [library, plan, lastWeek, targets, kinds] = await Promise.all([
      loadLibrary(supabase),
      loadPlan(supabase, start, days[6]),
      loadPlan(supabase, addDays(start, -7), addDays(start, -1)),
      loadTargets(supabase),
      loadDayKinds(supabase, days),
    ]);
    return { library, plan, lastWeek, targets, kinds };
  });

  if (data.error !== null) {
    return (
      <SetupNote title="Meal tables not set up yet">
        Run <code className="font-mono text-xs">supabase/migrations/20260924_meals.sql</code> in the Supabase SQL Editor, then reload. ({data.error})
      </SetupNote>
    );
  }

  const { library, plan, lastWeek, targets, kinds } = data.data;
  const mealMap = new Map(library.map((m) => [m.id, m]));
  const meals: MealSummary[] = library.map((m) => ({ id: m.id, name: m.name, slots: m.slots, servings: m.servings, perServing: perServing(m) }));
  const dayInfo: DayInfo[] = days.map((d) => ({
    day: d,
    label: formatDay(d, { weekday: "short", day: "numeric", month: "short" }),
    kind: kinds[d].kind,
    session: kinds[d].session,
    totals: dayTotals(plan.filter((e) => e.day === d), mealMap),
    target: targets[kinds[d].kind],
  }));

  const weekLabel = `${formatDay(days[0], { day: "numeric", month: "short" })} – ${formatDay(days[6], { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={`/meals?week=${addDays(start, -7)}`} className={navBtn} aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></Link>
        <Link href={`/meals?week=${addDays(start, 7)}`} className={navBtn} aria-label="Next week"><ChevronRight className="h-4 w-4" /></Link>
        {start !== thisWeek && <Link href="/meals" className={navBtn}>This week</Link>}
        <h2 className="ml-1 text-base font-semibold">{weekLabel}</h2>
      </div>

      {!targets.training && !targets.rest && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Set your training-day and rest-day targets in <Link href="/nutrition" className="font-medium text-orange-600 hover:underline">Nutrition</Link> to see how each day adds up.
        </p>
      )}

      <WeekPlan weekStart={start} days={dayInfo} entries={plan} meals={meals} hasLastWeek={lastWeek.length > 0} />
    </>
  );
}
