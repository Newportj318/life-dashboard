"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTargets } from "@/app/actions/meals";
import { ZERO, type Macros, type Targets } from "@/lib/meal-types";
import { btnPrimary, inputCls } from "@/components/meals/ui";

const FIELDS: [keyof Macros, string][] = [["kcal", "Calories"], ["protein", "Protein (g)"], ["carbs", "Carbs (g)"], ["fat", "Fat (g)"]];

export function TargetsForm({ targets }: { targets: Targets }) {
  const router = useRouter();
  const [training, setTraining] = useState<Macros>(targets.training ?? ZERO);
  const [rest, setRest] = useState<Macros>(targets.rest ?? ZERO);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const res = await saveTargets(training, rest);
      setMsg(res.ok ? "Saved." : res.error);
      if (res.ok) router.refresh();
    });

  const kcalFromMacros = (m: Macros) => Math.round(m.protein * 4 + m.carbs * 4 + m.fat * 9);

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {([["Training day", training, setTraining], ["Rest day", rest, setRest]] as const).map(([label, value, set]) => (
          <fieldset key={label}>
            <legend className="mb-2 text-sm font-semibold">{label}</legend>
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map(([k, name]) => (
                <label key={k} className="text-sm">
                  <span className="mb-1 block text-gray-600 dark:text-gray-400">{name}</span>
                  <input type="number" min={0} value={value[k] || ""} onChange={(e) => set({ ...value, [k]: Number(e.target.value) })} className={inputCls} />
                </label>
              ))}
            </div>
            {value.protein + value.carbs + value.fat > 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Macros add up to {kcalFromMacros(value).toLocaleString("en-AU")} kcal.</p>
            )}
          </fieldset>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={pending} className={btnPrimary}>{pending ? "Saving…" : "Save targets"}</button>
        {msg && <span role="status" className="text-sm text-gray-500 dark:text-gray-400">{msg}</span>}
      </div>
    </div>
  );
}
