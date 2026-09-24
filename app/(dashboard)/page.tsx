import Link from "next/link";
import { Dumbbell, Flame, Target } from "lucide-react";
import { Card, CardLink, PageHeader, ProgressBar, StatCard } from "@/components/dashboard";
import { NetWorthCard } from "@/components/finance/net-worth-card";
import { Greeting } from "@/components/greeting";
import { SupplementChecklist } from "@/components/nutrition/supplement-checklist";
import { attempt } from "@/lib/attempt";
import { addDays, formatDay, today } from "@/lib/dates";
import { money, recordAndLoadSnapshots, summariseAccounts, upcomingBills, yearBaselines } from "@/lib/finance";
import { SLOTS, SLOT_LABELS, perServing, round, scale } from "@/lib/meal-types";
import { dayTotals, loadDayKinds, loadLibrary, loadPlan, loadSupplements, loadTargets } from "@/lib/meals";
import { STAGES, dueLabel, nextTask, viewGoal } from "@/lib/goal-types";
import { loadGoals, loadProjects } from "@/lib/goals";
import { getAccounts, getEvents, pocketsmithConfigured } from "@/lib/pocketsmith";
import { createClient } from "@/lib/supabase/server";

const DISPLAY_NAME = "Jared";

async function todaysSession() {
  const supabase = await createClient();
  const { data } = await supabase.from("training_plan").select("label, kind").eq("day", today()).maybeSingle();
  if (!data) return { value: "Not planned", note: "Plan your week in Training" };
  if (data.kind === "rest") return { value: "Rest day", note: "Recover well" };
  return { value: data.label as string, note: data.kind === "cardio" ? "Cardio, from Strava" : "From your Hevy routines" };
}

async function moneyGlance() {
  if (!pocketsmithConfigured()) return null;
  const day = today();
  const [accounts, events] = await Promise.all([attempt(getAccounts), attempt(() => getEvents(day, addDays(day, 13)))]);
  const summary = accounts.data ? summariseAccounts(accounts.data) : null;
  // Record today's net worth here too, so history builds from Home visits, not just Finances.
  const history = summary ? await attempt(() => recordAndLoadSnapshots(day, summary.netWorth, summary.assets, summary.debts)) : null;
  return {
    netWorth: summary?.netWorth ?? null,
    baselines: history?.data ? yearBaselines(history.data, day) : [],
    bills: events.data ? upcomingBills(events.data).slice(0, 4) : null,
  };
}

async function foodToday() {
  const day = today();
  const supabase = await createClient();
  const res = await attempt(async () => {
    const [library, plan, targets, kinds, supps] = await Promise.all([
      loadLibrary(supabase),
      loadPlan(supabase, day, day),
      loadTargets(supabase),
      loadDayKinds(supabase, [day]),
      loadSupplements(supabase, day),
    ]);
    const meals = new Map(library.map((m) => [m.id, m]));
    return {
      day,
      entries: plan.map((e) => ({ ...e, meal: meals.get(e.mealId) })),
      totals: round(dayTotals(plan, meals)),
      target: targets[kinds[day].kind],
      kind: kinds[day].kind,
      supps,
    };
  });
  return res.data;
}

async function goalsAndProjects() {
  const supabase = await createClient();
  const res = await attempt(() => Promise.all([loadGoals(supabase), loadProjects(supabase)]));
  return res.data;
}

export default async function Home() {
  const [session, finance, food, gp] = await Promise.all([todaysSession(), moneyGlance(), foodToday(), goalsAndProjects()]);
  const day = today();
  const currentGoals = (gp?.[0] ?? []).filter((g) => g.status === "current").map((g) => viewGoal(g, finance?.netWorth ?? null));
  const nextDeadline = currentGoals.map((g) => g.deadline).filter((d): d is string => !!d && d >= day).sort()[0];
  const activeProjects = (gp?.[1] ?? [])
    .filter((p) => p.stage === "active" || p.stage === "planning")
    .sort((a, b) => (a.stage === b.stage ? 0 : a.stage === "active" ? -1 : 1))
    .slice(0, 5);
  return (
    <>
      <PageHeader title={<Greeting name={DISPLAY_NAME} />} subtitle="Here's your day at a glance" />

      <div className="stagger mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Dumbbell} accent="purple" label="Today's session" value={session.value} note={session.note} href="/training" />
        <StatCard
          icon={Flame}
          accent="green"
          label={food?.kind === "rest" ? "Calories (rest day)" : "Calories (training day)"}
          value={food?.target ? `${food.totals.kcal.toLocaleString("en-AU")} / ${Math.round(food.target.kcal).toLocaleString("en-AU")}` : "No target"}
          note={food?.target ? `Planned · P ${food.totals.protein}/${Math.round(food.target.protein)}g` : "Set targets in Nutrition"}
          href="/nutrition"
        />
        <NetWorthCard netWorth={finance?.netWorth ?? null} baselines={finance?.baselines ?? []} />
        <StatCard
          icon={Target}
          accent="amber"
          label="Current goals"
          value={gp ? String(currentGoals.length) : "—"}
          note={!gp ? "Set up Goals" : nextDeadline ? `Next deadline: ${dueLabel(nextDeadline, day).text}` : "No deadlines set"}
          href="/goals"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Today" action={<CardLink href="/meals" accent="orange">Meal plan</CardLink>}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Meals</h3>
                {!food ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Meal planning isn&apos;t set up yet.</p>
                ) : food.entries.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nothing planned today.</p>
                ) : (
                  <ul className="space-y-3">
                    {SLOTS.flatMap((slot) =>
                      food.entries
                        .filter((e) => e.slot === slot)
                        .map((e) => (
                          <li key={e.id} className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="block text-xs text-gray-500 dark:text-gray-400">{SLOT_LABELS[slot]}</span>
                              <span className="block truncate text-sm font-medium">{e.meal?.name ?? "Deleted meal"}</span>
                            </div>
                            {e.meal && (
                              <span className="shrink-0 text-xs text-gray-500 tabular-nums dark:text-gray-400">
                                {Math.round(scale(perServing(e.meal), e.myServings).kcal)} kcal
                              </span>
                            )}
                          </li>
                        ))
                    )}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Supplements</h3>
                {food ? (
                  <SupplementChecklist day={food.day} supplements={food.supps.supplements} taken={food.supps.taken} compact />
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Not set up yet.</p>
                )}
              </div>
            </div>
          </Card>

          <Card title="Active projects" action={<CardLink href="/projects" accent="sky">View all</CardLink>}>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{gp ? "No active projects." : "Projects aren't set up yet."}</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {activeProjects.map((p) => {
                  const next = nextTask(p);
                  return (
                    <li key={p.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <Link href={`/projects/${p.id}`} className="block truncate text-sm font-medium hover:underline">{p.title}</Link>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{next ? `Next: ${next.title}` : "No open tasks"}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                        {STAGES.find((st) => st.key === p.stage)?.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Goal progress" action={<CardLink href="/goals" accent="amber">View all</CardLink>}>
            {currentGoals.filter((g) => g.progress != null).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{gp ? "No current goals with progress yet." : "Goals aren't set up yet."}</p>
            ) : (
              <div className="space-y-4">
                {currentGoals
                  .filter((g) => g.progress != null)
                  .slice(0, 5)
                  .map((g) => (
                    <ProgressBar key={g.id} label={g.title} value={Math.round(g.progress! * 100)} max={100} accent="amber" />
                  ))}
              </div>
            )}
          </Card>

          <Card title="Upcoming bills" action={<CardLink href="/finances" accent="emerald">View all</CardLink>}>
            {!finance?.bills ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{finance ? "Couldn't load bills." : "Connect PocketSmith to see bills."}</p>
            ) : finance.bills.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No bills in the next 2 weeks.</p>
            ) : (
              <ul className="space-y-3">
                {finance.bills.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Due {formatDay(b.date, { weekday: "short", day: "numeric", month: "short" })}</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{money(b.amount, { cents: true })}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
