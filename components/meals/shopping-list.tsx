"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Home, RotateCcw } from "lucide-react";
import { setShoppingStatus } from "@/app/actions/meals";
import { fmtGrams } from "./ui";

type Row = { foodId: string; name: string; brand: string | null; grams: number; meals: string[] };
type Status = "have" | "bought";

export function ShoppingList({ weekStart, items, initial }: { weekStart: string; items: Row[]; initial: Record<string, Status> }) {
  const [, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic(initial, (s, { id, status }: { id: string; status: Status | null }) => {
    const next = { ...s };
    if (status) next[id] = status;
    else delete next[id];
    return next;
  });

  const set = (id: string, status: Status | null) =>
    startTransition(async () => {
      setOptimistic({ id, status });
      await setShoppingStatus(weekStart, id, status);
    });

  const toBuy = items.filter((i) => !state[i.foodId]);
  const bought = items.filter((i) => state[i.foodId] === "bought");
  const have = items.filter((i) => state[i.foodId] === "have");

  return (
    <div className="space-y-6">
      <Group title={`To buy (${toBuy.length})`} empty={items.length ? "Everything's sorted for this week." : null}>
        {toBuy.map((i) => (
          <ItemRow key={i.foodId} item={i}>
            <button onClick={() => set(i.foodId, "have")} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]" title="Already in the pantry">
              <Home className="h-3.5 w-3.5" /> Have it
            </button>
            <button onClick={() => set(i.foodId, "bought")} className="grid h-7 w-7 place-content-center rounded-md border border-gray-300 dark:border-gray-600 hover:border-orange-500" aria-label={`Mark ${i.name} bought`}>
              <span className="sr-only">Bought</span>
            </button>
          </ItemRow>
        ))}
      </Group>

      {bought.length > 0 && (
        <Group title={`In the trolley (${bought.length})`}>
          {bought.map((i) => (
            <ItemRow key={i.foodId} item={i} done>
              <button onClick={() => set(i.foodId, null)} className="grid h-7 w-7 place-content-center rounded-md bg-orange-600 text-white" aria-label={`Unmark ${i.name}`}>
                <Check className="h-4 w-4" />
              </button>
            </ItemRow>
          ))}
        </Group>
      )}

      {have.length > 0 && (
        <Group title={`Already have (${have.length})`}>
          {have.map((i) => (
            <ItemRow key={i.foodId} item={i} done>
              <button onClick={() => set(i.foodId, null)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                <RotateCcw className="h-3.5 w-3.5" /> Need it
              </button>
            </ItemRow>
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({ title, empty, children }: { title: string; empty?: string | null; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="surface p-5">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {hasChildren ? <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">{children}</ul> : empty && <p className="text-sm text-gray-500 dark:text-gray-400">{empty}</p>}
    </section>
  );
}

function ItemRow({ item, done, children }: { item: Row; done?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${done ? "text-gray-400 line-through dark:text-gray-500" : ""}`}>
          {item.name}
          {item.brand && <span className="font-normal text-gray-500 dark:text-gray-400"> · {item.brand}</span>}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400" title={item.meals.join(", ")}>
          {fmtGrams(item.grams)} · {item.meals.join(", ")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </li>
  );
}
