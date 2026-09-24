import type { Metadata } from "next";
import { Card, PageHeader, PlannedSections, SampleBadge } from "@/components/dashboard";

export const metadata: Metadata = { title: "Training · Life Dashboard" };

// Sample week until the Hevy routines dropdown and workout matching are built.
const week = [
  { day: "Mon", plan: "Push A", status: "done" },
  { day: "Tue", plan: "Pull A", status: "done" },
  { day: "Wed", plan: "5km run", status: "missed" },
  { day: "Thu", plan: "Legs A", status: "planned" },
  { day: "Fri", plan: "Push B", status: "planned" },
  { day: "Sat", plan: "Long run", status: "planned" },
  { day: "Sun", plan: "Rest", status: "rest" },
] as const;

const statusStyles = {
  done: "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
  missed: "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
  planned: "border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
  rest: "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400",
};

export default function TrainingPage() {
  return (
    <>
      <PageHeader title="Training" subtitle="Weekly plan, strength, cardio and body" />

      <Card title="This week" action={<SampleBadge />} className="mb-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {week.map((d) => (
            <div key={d.day} className={`rounded-lg border p-3 ${statusStyles[d.status]}`}>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">{d.day}</p>
              <p className="mt-1 text-sm font-semibold">{d.plan}</p>
              <p className="mt-1 text-xs capitalize opacity-80">{d.status}</p>
            </div>
          ))}
        </div>
      </Card>

      <PlannedSections
        accent="purple"
        step="step 2"
        sections={[
          { title: "Weekly planner", detail: "Pick a Hevy routine for each day; logged workouts tick it off automatically." },
          { title: "Strength progress", detail: "PRs and key lifts over time, from Hevy." },
          { title: "Cardio progress", detail: "Distance, pace and heart rate trends, from Strava." },
          { title: "Body measurements", detail: "Bodyweight and measurements over time, from Hevy." },
        ]}
      />
    </>
  );
}
