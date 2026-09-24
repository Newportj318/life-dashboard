import type { Metadata } from "next";
import { PageHeader, SetupNote } from "@/components/dashboard";
import { GoalsView } from "@/components/goals/goals-view";
import { attempt } from "@/lib/attempt";
import { today } from "@/lib/dates";
import { viewGoal } from "@/lib/goal-types";
import { loadGoals, netWorthForGoals } from "@/lib/goals";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Goals · Life Dashboard" };

export default async function GoalsPage() {
  const supabase = await createClient();
  const goals = await attempt(() => loadGoals(supabase));

  return (
    <>
      <PageHeader title="Goals" subtitle="What you're working towards, now and later" />
      {goals.error !== null ? (
        <SetupNote title="Goals tables not set up yet">
          Run <code className="font-mono text-xs">supabase/migrations/20260925_goals_projects.sql</code> in the Supabase SQL Editor, then reload. ({goals.error})
        </SetupNote>
      ) : (
        <GoalsView goals={await withNetWorth(goals.data)} today={today()} />
      )}
    </>
  );
}

async function withNetWorth(goals: Awaited<ReturnType<typeof loadGoals>>) {
  const netWorth = await netWorthForGoals(goals);
  return goals.map((g) => viewGoal(g, netWorth));
}
