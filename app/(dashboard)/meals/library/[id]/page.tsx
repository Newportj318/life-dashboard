import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MealEditor } from "@/components/meals/meal-editor";
import { loadLibrary } from "@/lib/meals";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Meal · Life Dashboard" };

export default async function EditMealPage({ params }: PageProps<"/meals/library/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const meal = (await loadLibrary(supabase)).find((m) => m.id === id);
  if (!meal) notFound();
  return <MealEditor meal={meal} />;
}
