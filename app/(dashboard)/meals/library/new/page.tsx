import type { Metadata } from "next";
import { MealEditor } from "@/components/meals/meal-editor";

export const metadata: Metadata = { title: "New Meal · Life Dashboard" };

export default function NewMealPage() {
  return <MealEditor />;
}
