import type { Metadata } from "next";
import { PageHeader, PlannedSections } from "@/components/dashboard";

export const metadata: Metadata = { title: "Nutrition · Life Dashboard" };

export default function NutritionPage() {
  return (
    <>
      <PageHeader title="Nutrition" subtitle="Daily targets and supplements" />
      <PlannedSections
        accent="green"
        step="step 4"
        sections={[
          { title: "Daily targets", detail: "Calorie and macro targets for today." },
          { title: "Supplements", detail: "Daily checklist grouped by morning, pre-workout and night." },
        ]}
      />
    </>
  );
}
