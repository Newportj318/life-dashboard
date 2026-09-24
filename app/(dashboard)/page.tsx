import { Circle, CircleCheck, Dumbbell, Flame, Target, Wallet } from "lucide-react";
import { Card, CardLink, PageHeader, ProgressBar, SampleBadge, StatCard } from "@/components/dashboard";

// Placeholder content until each area is wired up to real data.
const todaysMeals = [
  { slot: "Breakfast", meal: "Oats, whey and berries" },
  { slot: "Lunch", meal: "Chicken rice bowl" },
  { slot: "Dinner", meal: "Beef stir-fry" },
];

const supplements = [
  { name: "Creatine 5g", time: "Morning", done: true },
  { name: "Vitamin D", time: "Morning", done: true },
  { name: "Magnesium", time: "Night", done: false },
];

const goals = [
  { name: "Bench 120kg", value: 105, max: 120 },
  { name: "Emergency fund $10k", value: 6200, max: 10000 },
  { name: "Run a sub-25 5km", value: 3, max: 5 },
];

const bills = [
  { name: "Rent", due: "1 Oct", amount: "$1,800" },
  { name: "Phone", due: "3 Oct", amount: "$55" },
  { name: "Car insurance", due: "8 Oct", amount: "$120" },
];

const projects = [
  { name: "4x4 build", stage: "Active", next: "Order suspension kit" },
  { name: "Life dashboard", stage: "Active", next: "Set up login" },
  { name: "Garage shelving", stage: "Planning", next: "Measure wall" },
];

export default function Home() {
  return (
    <>
      <PageHeader title="Home" subtitle="Today at a glance" />

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Dumbbell} accent="purple" label="Today's session" value="Push A" note="From your Hevy routines" href="/training" />
        <StatCard icon={Flame} accent="green" label="Calorie target" value="2,650 kcal" note="P 190g · C 300g · F 75g" href="/nutrition" />
        <StatCard icon={Wallet} accent="emerald" label="Net worth" value="$48,300" note="Via PocketSmith" href="/finances" />
        <StatCard icon={Target} accent="amber" label="Active goals" value="3" note="1 milestone due this month" href="/goals" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Today" action={<SampleBadge />}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Meals</h3>
                <ul className="space-y-3">
                  {todaysMeals.map((m) => (
                    <li key={m.slot} className="flex flex-col">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{m.slot}</span>
                      <span className="text-sm font-medium">{m.meal}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Supplements</h3>
                <ul className="space-y-3">
                  {supplements.map((s) => (
                    <li key={s.name} className="flex items-center gap-3">
                      {s.done ? (
                        <CircleCheck className="h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-gray-400" />
                      )}
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{s.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card title="Active projects" action={<CardLink href="/projects" accent="sky">View all</CardLink>}>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {projects.map((p) => (
                <li key={p.name} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">Next: {p.next}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                    {p.stage}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Goal progress" action={<CardLink href="/goals" accent="amber">View all</CardLink>}>
            <div className="space-y-4">
              {goals.map((g) => (
                <ProgressBar key={g.name} label={g.name} value={g.value} max={g.max} accent="amber" />
              ))}
            </div>
          </Card>

          <Card title="Upcoming bills" action={<CardLink href="/finances" accent="emerald">View all</CardLink>}>
            <ul className="space-y-3">
              {bills.map((b) => (
                <li key={b.name} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Due {b.due}</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">{b.amount}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
