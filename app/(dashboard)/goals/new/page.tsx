import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard";
import { GoalEditor } from "@/components/goals/goal-editor";
import { currentNetWorth } from "@/lib/goals";

export const metadata: Metadata = { title: "New Goal · Life Dashboard" };

export default async function NewGoalPage() {
  // Fetched so a new net-worth goal can start from today's figure.
  const netWorth = await currentNetWorth();
  return (
    <>
      <PageHeader title="New goal" />
      <GoalEditor netWorth={netWorth} />
    </>
  );
}
