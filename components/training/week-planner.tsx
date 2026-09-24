"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CircleAlert, CircleCheck, CircleDashed, Copy, MoveRight, Pencil, Moon } from "lucide-react";
import { saveWeekPlan } from "@/app/actions/training";
import { CARDIO_TYPES, type DayStatus, type PlanEntry, type RoutineGroup, type WeekDay } from "@/lib/training-types";

// Status colours are reserved for state and always come with an icon + words.
const STATUS: Record<DayStatus, { label: string; card: string; icon: React.ComponentType<{ className?: string }> }> = {
  done: { label: "Done", icon: CircleCheck, card: "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300" },
  moved: { label: "Moved", icon: MoveRight, card: "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300" },
  missed: { label: "Missed", icon: CircleAlert, card: "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300" },
  today: { label: "Today", icon: CalendarCheck, card: "border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 ring-1 ring-purple-400/40" },
  planned: { label: "Planned", icon: CircleDashed, card: "border-purple-200 dark:border-purple-900 bg-white dark:bg-gray-900 text-purple-800 dark:text-purple-300" },
  rest: { label: "Rest", icon: Moon, card: "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400" },
  unplanned: { label: "No plan", icon: CircleDashed, card: "border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400" },
};

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// <select> values: "" | "rest" | "cardio:Run" | "routine:<id>"
function encode(p: PlanEntry | null) {
  if (!p) return "";
  if (p.kind === "rest") return "rest";
  if (p.kind === "cardio") return `cardio:${p.label}`;
  return `routine:${p.routine_id}`;
}

function decode(day: string, value: string, routines: Map<string, string>): PlanEntry | null {
  if (!value) return null;
  if (value === "rest") return { day, kind: "rest", routine_id: null, label: "Rest" };
  if (value.startsWith("cardio:")) return { day, kind: "cardio", routine_id: null, label: value.slice(7) };
  const id = value.slice(8);
  return { day, kind: "routine", routine_id: id, label: routines.get(id) ?? "Routine" };
}

const shortDay = (day: string) => Number(day.slice(8, 10));

export function WeekPlanner({
  week,
  routineGroups,
  lastWeekPlan,
  hevyReady,
}: {
  week: WeekDay[];
  routineGroups: RoutineGroup[];
  lastWeekPlan: PlanEntry[];
  hevyReady: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const routineTitles = new Map(routineGroups.flatMap((g) => g.routines.map((r) => [r.id, r.title] as const)));
  const start = week[0].day;

  const beginEdit = () => {
    setDraft(Object.fromEntries(week.map((d) => [d.day, encode(d.plan)])));
    setError(null);
    setEditing(true);
  };

  const copyLastWeek = () => {
    // Last week's Monday lines up with this week's Monday, and so on.
    const byOffset = new Map(lastWeekPlan.map((p) => [(Date.parse(p.day) - Date.parse(start)) / 86400000 + 7, p]));
    setDraft(Object.fromEntries(week.map((d, i) => [d.day, encode(byOffset.get(i) ?? null)])));
  };

  const save = () => {
    const entries = week.map((d) => decode(d.day, draft[d.day] ?? "", routineTitles)).filter((e): e is PlanEntry => !!e);
    startTransition(async () => {
      const res = await saveWeekPlan(start, entries);
      if (!res.ok) return setError(res.error);
      setEditing(false);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {editing ? (
          <>
            <button
              onClick={copyLastWeek}
              disabled={!lastWeekPlan.length}
              title={lastWeekPlan.length ? undefined : "Last week has no plan"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <Copy className="h-4 w-4" /> Copy last week
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={pending}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save plan"}
            </button>
          </>
        ) : (
          <button
            onClick={beginEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Pencil className="h-4 w-4" /> Edit plan
          </button>
        )}
      </div>

      {error && <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {editing && !hevyReady && (
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Connect Hevy to pick routines. Cardio and rest days work now.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {week.map((d, i) => {
          const s = STATUS[d.status];
          const Icon = s.icon;
          const extras = [
            ...d.workouts
              .filter((w) => !(d.plan?.kind === "routine" && d.status === "done" && w.title === d.plan.label))
              .map((w) => `${w.title} · ${w.minutes} min`),
            ...d.activities.map((a) => `${a.name} · ${a.km.toFixed(1)} km`),
          ];

          return (
            <div key={d.day} className={`flex flex-col rounded-lg border p-3 sm:min-h-32 ${editing ? "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" : s.card}`}>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                {DOW[i]} {shortDay(d.day)}
              </p>

              {editing ? (
                <select
                  value={draft[d.day] ?? ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [d.day]: e.target.value }))}
                  aria-label={`Session for ${DOW[i]}`}
                  className="mt-2 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value="">— No plan —</option>
                  <option value="rest">Rest</option>
                  <optgroup label="Cardio (Strava)">
                    {CARDIO_TYPES.map((c) => (
                      <option key={c} value={`cardio:${c}`}>{c}</option>
                    ))}
                  </optgroup>
                  {routineGroups.map((g) => (
                    <optgroup key={g.folder} label={g.folder}>
                      {g.routines.map((r) => (
                        <option key={r.id} value={`routine:${r.id}`}>{r.title}</option>
                      ))}
                    </optgroup>
                  ))}
                  {/* Keep a saved routine selectable even if Hevy is unreachable right now. */}
                  {d.plan?.kind === "routine" && !routineTitles.has(d.plan.routine_id ?? "") && (
                    <option value={encode(d.plan)}>{d.plan.label}</option>
                  )}
                </select>
              ) : (
                <>
                  <p className="mt-1 text-sm font-semibold leading-snug">{d.plan?.label ?? "—"}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {s.label}
                    {d.status === "moved" && d.movedTo && ` to ${DOW[week.findIndex((w) => w.day === d.movedTo)]}`}
                  </p>
                  {extras.length > 0 && (
                    <ul className="mt-auto space-y-0.5 pt-2 text-xs opacity-80">
                      {extras.map((x) => (
                        <li key={x} className="truncate" title={x}>+ {x}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
