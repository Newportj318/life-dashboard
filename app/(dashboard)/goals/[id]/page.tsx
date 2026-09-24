import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard";
import { GoalEditor } from "@/components/goals/goal-editor";
import { currentNetWorth, loadGoals } from "@/lib/goals";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Goal · Life Dashboard" };

export default async function EditGoalPage({ params }: PageProps<"/goals/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const goal = (await loadGoals(supabase)).find((g) => g.id === id);
  if (!goal) notFound();
  const netWorth = await currentNetWorth();
  return (
    <>
      <PageHeader title="Edit goal" />
      <GoalEditor goal={goal} netWorth={netWorth} />
    </>
  );
}
