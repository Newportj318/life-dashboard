"use server";

import { revalidatePath } from "next/cache";
import { addDays, isDay } from "@/lib/dates";
import { SLOTS, SUPPLEMENT_TIMES, type Food, type FoodDraft, type Macros, type Slot } from "@/lib/meal-types";
import { createClient } from "@/lib/supabase/server";

export type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };

const fail = (error: string) => ({ ok: false as const, error });
const done = <T,>(data: T) => ({ ok: true as const, data });

// Numbers from forms: finite, non-negative, capped so a typo can't store nonsense.
function n(v: unknown, max = 100000) {
  const x = Number(v);
  return Number.isFinite(x) && x >= 0 ? Math.min(x, max) : 0;
}
const text = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

function refresh() {
  revalidatePath("/meals", "layout");
  revalidatePath("/nutrition");
  revalidatePath("/");
}

// ---------- Food search (Open Food Facts + your saved foods) ----------

const OFF_URL = "https://search.openfoodfacts.org/search";
const OFF_FIELDS = "code,product_name,brands,nutriments,serving_quantity";

type OffHit = {
  code?: string;
  product_name?: string;
  brands?: string[] | string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
};

function fromOff(h: OffHit): FoodDraft | null {
  const nut = h.nutriments ?? {};
  const kcal = Number(nut["energy-kcal_100g"] ?? (nut["energy_100g"] != null ? Number(nut["energy_100g"]) / 4.184 : NaN));
  if (!h.product_name || !Number.isFinite(kcal)) return null;
  const brand = Array.isArray(h.brands) ? h.brands[0] : h.brands?.split(",")[0];
  const serving = Number(h.serving_quantity);
  return {
    name: h.product_name.trim(),
    brand: brand?.trim() || null,
    off_code: h.code ?? null,
    kcal: Math.round(kcal * 10) / 10,
    protein: n(nut.proteins_100g),
    carbs: n(nut.carbohydrates_100g),
    fat: n(nut.fat_100g),
    serving_g: Number.isFinite(serving) && serving > 0 ? serving : null,
  };
}

async function searchOff(q: string, australiaOnly: boolean): Promise<FoodDraft[]> {
  const url = new URL(OFF_URL);
  url.searchParams.set("q", australiaOnly ? `${q} countries_tags:"en:australia"` : q);
  url.searchParams.set("page_size", "15");
  url.searchParams.set("fields", OFF_FIELDS);
  const res = await fetch(url, {
    headers: { "user-agent": "LifeDashboard/0.1 (personal meal planner)" },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Food search failed (${res.status})`);
  const data = (await res.json()) as { hits?: OffHit[] };
  return (data.hits ?? []).map(fromOff).filter((f): f is FoodDraft => !!f);
}

/** Your saved foods first, then Australian products, then worldwide if there are few. */
export async function searchFoods(query: string): Promise<Result<{ saved: Food[]; found: FoodDraft[] }>> {
  const q = text(query, 80);
  if (q.length < 2) return done({ saved: [], found: [] });

  const supabase = await createClient();
  const saved = await supabase.from("foods").select("*").ilike("name", `%${q.replace(/[%_]/g, "")}%`).order("name").limit(10);

  let found: FoodDraft[] = [];
  try {
    found = await searchOff(q, true);
    if (found.length < 5) found = [...found, ...(await searchOff(q, false))];
  } catch (e) {
    if (!saved.data?.length) return fail(e instanceof Error ? e.message : "Food search failed");
  }
  const savedCodes = new Set((saved.data ?? []).map((f) => f.off_code).filter(Boolean));
  const unique = new Map<string, FoodDraft>();
  for (const f of found) {
    const key = f.off_code ?? `${f.name}|${f.brand}`;
    if (!savedCodes.has(f.off_code) && !unique.has(key)) unique.set(key, f);
  }
  const savedFoods: Food[] = (saved.data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    brand: f.brand,
    off_code: f.off_code,
    serving_g: f.serving_g == null ? null : Number(f.serving_g),
    kcal: Number(f.kcal),
    protein: Number(f.protein),
    carbs: Number(f.carbs),
    fat: Number(f.fat),
  }));
  return done({ saved: savedFoods, found: [...unique.values()].slice(0, 15) });
}

// ---------- Meals ----------

export type MealInput = {
  id?: string;
  name: string;
  slots: Slot[];
  servings: number;
  extra: Macros;
  notes: string;
  items: { food: FoodDraft; grams: number }[];
};

/** Saves a food to your library (reusing an existing one with the same barcode). */
async function ensureFood(supabase: Awaited<ReturnType<typeof createClient>>, f: FoodDraft): Promise<string> {
  if (f.id) return f.id;
  const row = {
    name: text(f.name, 160) || "Food",
    brand: text(f.brand, 80) || null,
    off_code: text(f.off_code, 40) || null,
    kcal: n(f.kcal, 1000),
    protein: n(f.protein, 100),
    carbs: n(f.carbs, 100),
    fat: n(f.fat, 100),
    serving_g: f.serving_g ? n(f.serving_g, 5000) : null,
  };
  if (row.off_code) {
    const existing = await supabase.from("foods").select("id").eq("off_code", row.off_code).maybeSingle();
    if (existing.data) return existing.data.id as string;
  }
  const { data, error } = await supabase.from("foods").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function saveMeal(input: MealInput): Promise<Result<{ id: string }>> {
  const name = text(input.name, 120);
  if (!name) return fail("Give the meal a name.");
  const slots = (input.slots ?? []).filter((s): s is Slot => (SLOTS as readonly string[]).includes(s));
  const servings = Math.max(0.25, n(input.servings, 100)) || 1;
  const items = (input.items ?? []).filter((i) => n(i.grams) > 0).slice(0, 60);

  const supabase = await createClient();
  try {
    const foodIds: string[] = [];
    for (const i of items) foodIds.push(await ensureFood(supabase, i.food));

    const row = {
      name,
      slots,
      servings,
      extra_kcal: n(input.extra?.kcal, 10000),
      extra_protein: n(input.extra?.protein, 1000),
      extra_carbs: n(input.extra?.carbs, 1000),
      extra_fat: n(input.extra?.fat, 1000),
      notes: text(input.notes, 2000) || null,
      updated_at: new Date().toISOString(),
    };
    const saved = input.id
      ? await supabase.from("meals").update(row).eq("id", input.id).select("id").single()
      : await supabase.from("meals").insert(row).select("id").single();
    if (saved.error) return fail(saved.error.message);
    const id = saved.data.id as string;

    const cleared = await supabase.from("meal_items").delete().eq("meal_id", id);
    if (cleared.error) return fail(cleared.error.message);
    if (items.length) {
      const ins = await supabase
        .from("meal_items")
        .insert(items.map((i, position) => ({ meal_id: id, food_id: foodIds[position], grams: n(i.grams, 20000), position })));
      if (ins.error) return fail(ins.error.message);
    }
    refresh();
    return done({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Couldn't save the meal.");
  }
}

export async function deleteMeal(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("meals").delete().eq("id", text(id, 64));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

// ---------- Week plan ----------

export async function addToPlan(day: string, slot: Slot, mealId: string, servings: number, myServings: number): Promise<Result> {
  if (!isDay(day) || !(SLOTS as readonly string[]).includes(slot)) return fail("Invalid day or slot.");
  const mine = n(myServings, 20);
  // You can't eat more than gets cooked, so the shopping list always covers your portion.
  const cooked = Math.max(0.25, n(servings, 50), mine);
  const supabase = await createClient();
  const { error } = await supabase.from("meal_plan").insert({
    day,
    slot,
    meal_id: text(mealId, 64),
    servings: cooked,
    my_servings: mine,
  });
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

export async function removeFromPlan(entryId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("meal_plan").delete().eq("id", text(entryId, 64));
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

/** Replaces this week's plan with last week's, shifted forward 7 days. */
export async function copyLastWeekMeals(weekStart: string): Promise<Result<{ copied: number }>> {
  if (!isDay(weekStart)) return fail("Invalid week.");
  const supabase = await createClient();
  const prev = await supabase
    .from("meal_plan")
    .select("day, slot, meal_id, servings, my_servings")
    .gte("day", addDays(weekStart, -7))
    .lte("day", addDays(weekStart, -1));
  if (prev.error) return fail(prev.error.message);
  if (!prev.data.length) return fail("Last week has no meals planned.");

  const cleared = await supabase.from("meal_plan").delete().gte("day", weekStart).lte("day", addDays(weekStart, 6));
  if (cleared.error) return fail(cleared.error.message);
  const { error } = await supabase.from("meal_plan").insert(prev.data.map((r) => ({ ...r, day: addDays(r.day as string, 7) })));
  if (error) return fail(error.message);
  refresh();
  return done({ copied: prev.data.length });
}

// ---------- Targets ----------

export async function saveTargets(training: Macros, rest: Macros): Promise<Result> {
  const clean = (m: Macros) => ({ kcal: n(m.kcal, 10000), protein: n(m.protein, 1000), carbs: n(m.carbs, 2000), fat: n(m.fat, 1000) });
  const supabase = await createClient();
  const { error } = await supabase.from("nutrition_targets").upsert(
    [
      { kind: "training", ...clean(training) },
      { kind: "rest", ...clean(rest) },
    ],
    { onConflict: "user_id,kind" }
  );
  if (error) return fail(error.message);
  refresh();
  return done(null);
}

// ---------- Supplements ----------

export type SupplementInput = { id?: string; name: string; dose: string; time: string; active: boolean };

export async function saveSupplements(list: SupplementInput[]): Promise<Result> {
  const supabase = await createClient();
  const rows = list
    .map((s, position) => ({
      ...(s.id ? { id: text(s.id, 64) } : {}),
      name: text(s.name, 80),
      dose: text(s.dose, 60) || null,
      time_of_day: (SUPPLEMENT_TIMES.map((t) => t.key) as string[]).includes(s.time) ? s.time : "morning",
      active: s.active !== false,
      position,
    }))
    .filter((r) => r.name);

  const existing = await supabase.from("supplements").select("id");
  if (existing.error) return fail(existing.error.message);
  const keep = new Set(rows.map((r) => r.id).filter(Boolean));
  const removed = existing.data.map((r) => r.id as string).filter((id) => !keep.has(id));
  if (removed.length) {
    const del = await supabase.from("supplements").delete().in("id", removed);
    if (del.error) return fail(del.error.message);
  }
  for (const r of rows) {
    const res = r.id ? await supabase.from("supplements").update(r).eq("id", r.id) : await supabase.from("supplements").insert(r);
    if (res.error) return fail(res.error.message);
  }
  refresh();
  return done(null);
}

export async function setSupplementTaken(day: string, supplementId: string, taken: boolean): Promise<Result> {
  if (!isDay(day)) return fail("Invalid day.");
  const supabase = await createClient();
  const id = text(supplementId, 64);
  const { error } = taken
    ? await supabase.from("supplement_log").upsert({ day, supplement_id: id }, { onConflict: "user_id,day,supplement_id" })
    : await supabase.from("supplement_log").delete().eq("day", day).eq("supplement_id", id);
  if (error) return fail(error.message);
  revalidatePath("/nutrition");
  revalidatePath("/");
  return done(null);
}

// ---------- Shopping list ----------

export async function setShoppingStatus(weekStart: string, foodId: string, status: "have" | "bought" | null): Promise<Result> {
  if (!isDay(weekStart)) return fail("Invalid week.");
  const supabase = await createClient();
  const id = text(foodId, 64);
  const { error } = status
    ? await supabase.from("shopping_state").upsert({ week_start: weekStart, food_id: id, status }, { onConflict: "user_id,week_start,food_id" })
    : await supabase.from("shopping_state").delete().eq("week_start", weekStart).eq("food_id", id);
  if (error) return fail(error.message);
  revalidatePath("/meals/shopping");
  return done(null);
}
