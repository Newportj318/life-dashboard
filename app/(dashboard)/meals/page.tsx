import type { Metadata } from "next";
import { PageHeader, PlannedSections } from "@/components/dashboard";

export const metadata: Metadata = { title: "Meal Planning · Life Dashboard" };

export default function MealsPage() {
  return (
    <>
      <PageHeader title="Meal Planning" subtitle="Weekly meals, recipes and shopping" />
      <PlannedSections
        accent="orange"
        step="step 4"
        sections={[
          { title: "Weekly meal calendar", detail: "Breakfast, lunch and dinner for each day of the week." },
          { title: "Recipe library", detail: "Saved recipes with ingredients and macros." },
          { title: "Shopping list", detail: "Built automatically from the week's planned meals." },
          { title: "Meal prep", detail: "Batch cooking sessions and portions for the week." },
        ]}
      />
    </>
  );
}
