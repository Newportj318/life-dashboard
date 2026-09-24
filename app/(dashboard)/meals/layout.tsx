import { Suspense } from "react";
import { PageHeader } from "@/components/dashboard";
import { MealTabs } from "@/components/meals/meal-tabs";

export default function MealsLayout({ children }: LayoutProps<"/meals">) {
  return (
    <>
      <PageHeader title="Meal Planning" subtitle="Your meal library, week plan and shopping list" />
      <Suspense>
        <MealTabs />
      </Suspense>
      {children}
    </>
  );
}
