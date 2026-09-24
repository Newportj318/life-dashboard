import type { Metadata } from "next";
import Link from "next/link";
import { Dumbbell, Moon } from "lucide-react";
import { Card, PageHeader, SetupNote } from "@/components/dashboard";
import { SupplementChecklist } from "@/components/nutrition/supplement-checklist";
import { SupplementsEditor } from "@/components/nutrition/supplements-editor";
import { TargetsForm } from "@/components/nutrition/targets-form";
import { attempt } from "@/lib/attempt";
import { formatDay, today, weekDays, weekStart } from "@/lib/dates";
import { round, type Macros } from "@/lib/meal-types";
import { dayTotals, loadDayKinds, loadLibrary, loadPlan, loadSupplements, loadTargets } from "@/lib/meals";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nutrition · Life Dashboard" };

const MACROS: { key: keyof Macros; label: string; unit: string }[] = [
  { key: "kcal", label: "Calories", unit: " kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
];

export default async function NutritionPage() {
  const todayDay = today();
  const days = weekDays(weekStart(todayDay));
  const supabase = await createClient();

  const data = await attempt(async () => {
    const [library, plan, targets, kinds, supps] = await Promise.all([
      loadLibrary(supabase),
      loadPlan(supabase, days[0], days[6]),
      loadTargets(supabase),
      loadDayKinds(supabase, days),
      loadSupplements(supabase, todayDay),
    ]);
    return { library, plan, targets, kinds, supps };
  });

  if (data.error !== null) {
    return (
      <>
        <PageHeader title="Nutrition" subtitle="Daily targets and supplements" />
        <SetupNote title="Nutrition tables not set up yet">
          Run <code className="font-mono text-xs">supabase/migrations/20260924_meals.sql</code> in the Supabase SQL Editor, then reload. ({data.error})
        </SetupNote>
      </>
    );
  }

  const { library, plan, targets, kinds, supps } = data.data;
  const meals = new Map(library.map((m) => [m.id, m]));
  const todayKind = kinds[todayDay];
  const target = targets[todayKind.kind];
  const planned = round(dayTotals(plan.filter((e) => e.day === todayDay), meals));

  return (
    <>
      <PageHeader title="Nutrition" subtitle="Daily targets and supplements" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
        <div className="space-y-6 xl:col-span-2">
          <Card
            title="Today"
            action={
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                {todayKind.kind === "training" ? <Dumbbell className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {todayKind.kind === "training" ? `Training day${todayKind.session ? ` · ${todayKind.session}` : ""}` : "Rest day"}
              </span>
            }
          >
            {!target ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Set your targets below to track today against them.</p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {MACROS.map((m) => {
                  const value = planned[m.key];
                  const goal = Math.round(target[m.key]);
                  const pct = goal ? Math.round((value / goal) * 100) : 0;
                  return (
                    <div key={m.key}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{m.label}</span>
                        <span className="text-sm tabular-nums">
                          <span className="font-semibold">{value.toLocaleString("en-AU")}</span>
                          <span className="text-gray-500 dark:text-gray-400"> / {goal.toLocaleString("en-AU")}{m.unit}</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10" role="img" aria-label={`${m.label}: ${value} of ${goal}${m.unit} planned (${pct}%)`}>
                        <div className="bar-fill h-2 rounded-full bg-green-600" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
              Planned from your <Link href="/meals" className="font-medium text-green-700 hover:underline dark:text-green-400">meal plan</Link>.
            </p>
          </Card>

          <Card title="This week">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                    <th className="pb-2 font-medium">Day</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 text-right font-medium">Calories</th>
                    <th className="pb-2 text-right font-medium">Protein</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                  {days.map((d) => {
                    const t = round(dayTotals(plan.filter((e) => e.day === d), meals));
                    const goal = targets[kinds[d].kind];
                    return (
                      <tr key={d} className={d === todayDay ? "font-semibold" : ""}>
                        <td className="py-2">{formatDay(d, { weekday: "short", day: "numeric", month: "short" })}</td>
                        <td className="py-2 text-gray-600 dark:text-gray-400">{kinds[d].kind === "training" ? "Training" : "Rest"}</td>
                        <td className="py-2 text-right tabular-nums">
                          {t.kcal.toLocaleString("en-AU")}
                          {goal && <span className="font-normal text-gray-500 dark:text-gray-400"> / {Math.round(goal.kcal).toLocaleString("en-AU")}</span>}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {t.protein}g{goal && <span className="font-normal text-gray-500 dark:text-gray-400"> / {Math.round(goal.protein)}g</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Targets">
            <p className="-mt-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
              Days with a Hevy routine or cardio in your Training plan use the training-day targets; everything else uses rest-day targets.
            </p>
            <TargetsForm targets={targets} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Supplements today">
            <SupplementChecklist day={todayDay} supplements={supps.supplements} taken={supps.taken} />
          </Card>
          <Card title="Edit supplements">
            <SupplementsEditor supplements={supps.supplements} />
          </Card>
        </div>
      </div>
    </>
  );
}
