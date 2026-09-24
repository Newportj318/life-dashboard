import type { Metadata } from "next";
import { SetupNote } from "@/components/dashboard";
import { MealLibrary } from "@/components/meals/meal-library";
import { attempt } from "@/lib/attempt";
import { perServing } from "@/lib/meal-types";
import { loadLibrary } from "@/lib/meals";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Meal Library · Life Dashboard" };

export default async function LibraryPage() {
  const supabase = await createClient();
  const library = await attempt(() => loadLibrary(supabase));
  if (library.error !== null) {
    return (
      <SetupNote title="Meal tables not set up yet">
        Run <code className="font-mono text-xs">supabase/migrations/20260924_meals.sql</code> in the Supabase SQL Editor, then reload. ({library.error})
      </SetupNote>
    );
  }
  return (
    <MealLibrary
      meals={library.data.map((m) => ({
        id: m.id,
        name: m.name,
        slots: m.slots,
        servings: m.servings,
        perServing: perServing(m),
        ingredientCount: m.items.length,
      }))}
    />
  );
}
