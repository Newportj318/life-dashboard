import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Dumbbell, Footprints, Route, Trophy } from "lucide-react";
import { Card, PageHeader, SetupNote, StatCard } from "@/components/dashboard";
import { attempt } from "@/lib/attempt";
import { BarChart, LineChart, Sparkline, TableView } from "@/components/charts";
import { WeekPlanner } from "@/components/training/week-planner";
import { disconnectStrava } from "@/app/actions/training";
import { addDays, dayStartUnix, formatDay, isDay, localDay, today, weekDays, weekStart } from "@/lib/dates";
import { getBodyMeasurements, getRoutineFolders, getRoutines, getWorkoutsSince, hevyConfigured } from "@/lib/hevy";
import { getActivitiesSince, stravaConfigured } from "@/lib/strava";
import { createClient } from "@/lib/supabase/server";
import {
  bodyweightSeries,
  buildWeek,
  formatPace,
  groupRoutines,
  strengthProgress,
  weekTotals,
  weeklyDistance,
} from "@/lib/training";
import type { PlanEntry } from "@/lib/training-types";

export const metadata: Metadata = { title: "Training · Life Dashboard" };

const HISTORY_WEEKS = 12;

const STRAVA_MESSAGES: Record<string, string> = {
  connected: "Strava connected.",
  denied: "Strava access wasn't approved.",
  "missing-scope": "Strava needs permission to view your activities, including private ones. Try connecting again and leave every box ticked.",
  failed: "Couldn't connect Strava. Try again.",
  "not-configured": "Add your Strava app keys first (see below).",
};

export default async function TrainingPage({ searchParams }: PageProps<"/training">) {
  const params = await searchParams;
  const todayDay = today();
  const thisWeek = weekStart(todayDay);
  const requested = typeof params.week === "string" && isDay(params.week) ? weekStart(params.week) : thisWeek;
  const days = weekDays(requested);
  const historyWeeks = Array.from({ length: HISTORY_WEEKS }, (_, i) => addDays(thisWeek, -7 * (HISTORY_WEEKS - 1 - i)));
  const since = requested < historyWeeks[0] ? requested : historyWeeks[0];

  const supabase = await createClient();
  const hevyOn = hevyConfigured();
  const stravaKeys = stravaConfigured();

  const [plan, routines, folders, workouts, activities, body] = await Promise.all([
    attempt(async () => {
      const { data, error } = await supabase
        .from("training_plan")
        .select("day, kind, routine_id, label")
        .gte("day", addDays(requested, -7))
        .lte("day", addDays(requested, 6));
      if (error) throw new Error(error.message);
      return (data ?? []) as PlanEntry[];
    }),
    hevyOn ? attempt(getRoutines) : null,
    hevyOn ? attempt(getRoutineFolders) : null,
    hevyOn ? attempt(() => getWorkoutsSince(since)) : null,
    stravaKeys ? attempt(() => getActivitiesSince(dayStartUnix(since))) : null,
    hevyOn ? attempt(getBodyMeasurements) : null,
  ]);

  const planRows = plan.data ?? [];
  const thisPlan = planRows.filter((p) => p.day >= requested);
  const lastWeekPlan = planRows.filter((p) => p.day < requested);
  const hevyWorkouts = workouts?.data ?? [];
  const stravaActivities = activities?.data ?? [];
  const stravaLinked = activities?.data !== null && activities?.data !== undefined;

  const week = buildWeek(days, thisPlan, hevyWorkouts, stravaActivities, todayDay);
  const totals = weekTotals(week, hevyWorkouts, stravaActivities);
  const lifts = strengthProgress(hevyWorkouts.filter((w) => localDay(w.start_time) >= historyWeeks[0]), todayDay);
  const distance = weeklyDistance(stravaActivities, historyWeeks);
  const recentActivities = stravaActivities.slice(0, 5);
  const weight = bodyweightSeries(body?.data ?? []);
  const routineGroups = groupRoutines(routines?.data ?? [], folders?.data ?? []);

  const hevyErrors = [routines, folders, workouts, body].map((r) => r?.error).filter(Boolean);
  const stravaMessage = typeof params.strava === "string" ? STRAVA_MESSAGES[params.strava] : undefined;

  const weekLabel = `${formatDay(days[0], { day: "numeric", month: "short" })} – ${formatDay(days[6], { day: "numeric", month: "short", year: "numeric" })}`;
  const navBtn =
    "inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06]";

  const latestWeight = weight.at(-1);
  const monthAgo = latestWeight && [...weight].reverse().find((w) => w.day <= addDays(latestWeight.day, -30));

  return (
    <>
      <PageHeader title="Training" subtitle="Weekly plan, strength, cardio and body" />

      {stravaMessage && (
        <p role="status" className="mb-6 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-3 text-sm">
          {stravaMessage}
        </p>
      )}
      {plan.error && (
        <SetupNote title="Training tables not set up yet">
          Run <code className="font-mono text-xs">supabase/migrations/20260924_training.sql</code> in the Supabase SQL Editor, then reload. ({plan.error})
        </SetupNote>
      )}
      {!hevyOn && (
        <SetupNote title="Connect Hevy">
          Add <code className="font-mono text-xs">HEVY_API_KEY</code> to <code className="font-mono text-xs">.env.local</code> (and Vercel), then restart. The key is in Hevy → Settings → Developer.
        </SetupNote>
      )}
      {hevyErrors.length > 0 && (
        <SetupNote title="Couldn't reach Hevy">Check your API key is right. ({hevyErrors[0]})</SetupNote>
      )}

      {/* Week navigation scopes everything in the "This week" row. */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link href={`/training?week=${addDays(requested, -7)}`} className={navBtn} aria-label="Previous week">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link href={`/training?week=${addDays(requested, 7)}`} className={navBtn} aria-label="Next week">
          <ChevronRight className="h-4 w-4" />
        </Link>
        {requested !== thisWeek && (
          <Link href="/training" className={navBtn}>This week</Link>
        )}
        <h2 className="ml-1 text-base font-semibold">{weekLabel}</h2>
      </div>

      <div className="stagger mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Trophy} accent="purple" label="Plan completed" value={`${totals.completed} / ${totals.planned}`} note="Planned sessions done or moved" />
        <StatCard icon={Dumbbell} accent="purple" label="Volume" value={`${Math.round(totals.volumeKg).toLocaleString("en-AU")} kg`} note="Working sets, from Hevy" />
        <StatCard icon={Route} accent="purple" label="Distance" value={`${totals.km.toFixed(1)} km`} note={stravaLinked ? "From Strava" : "Connect Strava to track"} />
        <StatCard icon={Clock} accent="purple" label="Time training" value={`${Math.floor(totals.minutes / 60)}h ${totals.minutes % 60}m`} note={`${totals.sessions} sessions`} />
      </div>

      <Card title="Week plan" className="mb-8">
        <WeekPlanner week={week} routineGroups={routineGroups} lastWeekPlan={lastWeekPlan} hevyReady={routineGroups.length > 0} />
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Strength progress">
          {!hevyOn ? (
            <Empty>Connect Hevy to see your lifts.</Empty>
          ) : lifts.length === 0 ? (
            <Empty>No weighted sets in the last {HISTORY_WEEKS} weeks.</Empty>
          ) : (
            <>
              <p className="-mt-3 mb-4 text-sm text-gray-500 dark:text-gray-400">
                Your most-trained lifts, last {HISTORY_WEEKS} weeks. Best estimated 1-rep max (e1RM) from sets of 12 reps or fewer.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                      <th className="pb-2 font-medium">Lift</th>
                      <th className="pb-2 text-right font-medium">Best e1RM</th>
                      <th className="hidden pb-2 text-right font-medium sm:table-cell">Best set</th>
                      <th className="pb-2 pl-4 font-medium">Weekly trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {lifts.map((l) => (
                      <tr key={l.id}>
                        <td className="max-w-48 py-2.5 pr-3">
                          <span className="block truncate font-medium" title={l.title}>{l.title}</span>
                          {l.recentPr && (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                              <Trophy className="h-3 w-3" /> PR {formatDay(l.bestDay, { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right tabular-nums font-semibold">{l.bestE1rm} kg</td>
                        <td className="hidden py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-400 sm:table-cell">{l.bestSet}</td>
                        <td className="py-2.5 pl-4">
                          <Sparkline values={l.weekly.map((w) => w.value)} label={`${l.title} weekly best e1RM: ${l.weekly.map((w) => w.value).join(", ")} kg`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        <Card title="Bodyweight">
          {!hevyOn ? (
            <Empty>Connect Hevy to see bodyweight.</Empty>
          ) : weight.length === 0 ? (
            <Empty>No bodyweight logged in Hevy yet.</Empty>
          ) : (
            <>
              <div className="-mt-3 mb-4 flex items-baseline gap-3">
                <span className="text-2xl font-bold">{latestWeight!.value} kg</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDay(latestWeight!.day, { day: "numeric", month: "short" })}
                  {monthAgo && ` · ${latestWeight!.value - monthAgo.value >= 0 ? "+" : ""}${(latestWeight!.value - monthAgo.value).toFixed(1)} kg in 30 days`}
                </span>
              </div>
              <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Bodyweight (kg)</h3>
              <LineChart
                label="Bodyweight over time"
                unit=" kg"
                data={weight.map((w) => ({ key: w.day, label: formatDay(w.day, { day: "numeric", month: "short" }), value: w.value }))}
              />
              <TableView
                unit=" kg"
                columns={["Date", "Weight"]}
                data={[...weight].reverse().map((w) => ({ key: w.day, label: formatDay(w.day, { day: "numeric", month: "short", year: "numeric" }), value: w.value }))}
              />
            </>
          )}
        </Card>

        <Card
          title="Cardio"
          className="xl:col-span-2"
          action={
            stravaLinked ? (
              <form action={disconnectStrava}>
                <button className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">Disconnect Strava</button>
              </form>
            ) : null
          }
        >
          {!stravaKeys ? (
            <Empty>
              Add <code className="font-mono text-xs">STRAVA_CLIENT_ID</code> and <code className="font-mono text-xs">STRAVA_CLIENT_SECRET</code> to <code className="font-mono text-xs">.env.local</code> (and Vercel), then restart.
            </Empty>
          ) : activities?.error ? (
            <Empty>Couldn&apos;t load Strava. ({activities.error})</Empty>
          ) : !stravaLinked ? (
            <div className="py-6 text-center">
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Connect Strava to see runs, rides and distance each week.</p>
              {/* Plain link: this leaves the app for Strava's approval page. */}
              <a href="/api/strava/connect" className="inline-flex items-center gap-2 rounded-lg bg-[#FC4C02] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                <Footprints className="h-4 w-4" /> Connect Strava
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Distance per week (km), last {HISTORY_WEEKS} weeks</h3>
                <BarChart
                  label={`Distance per week, last ${HISTORY_WEEKS} weeks`}
                  unit=" km"
                  data={distance.map((d) => ({ key: d.week, label: formatDay(d.week, { day: "numeric", month: "short" }), value: d.value }))}
                />
                <TableView
                  unit=" km"
                  columns={["Week of", "Distance"]}
                  data={distance.map((d) => ({ key: d.week, label: formatDay(d.week, { day: "numeric", month: "short" }), value: d.value }))}
                />
              </div>
              <div className="lg:col-span-2">
                <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Recent activities</h3>
                {recentActivities.length === 0 ? (
                  <Empty>No activities in the last {HISTORY_WEEKS} weeks.</Empty>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {recentActivities.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{a.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDay(localDay(a.start_date), { weekday: "short", day: "numeric", month: "short" })} · {a.sport_type}
                          </p>
                        </div>
                        <div className="shrink-0 text-right text-sm tabular-nums">
                          <p className="font-medium">{(a.distance / 1000).toFixed(1)} km</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatPace(a)}
                            {a.average_heartrate ? ` · ${Math.round(a.average_heartrate)} bpm` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">{children}</p>;
}
