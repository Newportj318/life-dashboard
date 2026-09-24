"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { saveSupplements, type SupplementInput } from "@/app/actions/meals";
import { SUPPLEMENT_TIMES, type Supplement } from "@/lib/meal-types";
import { btnPrimary, btnSecondary, inputCls } from "@/components/meals/ui";

export function SupplementsEditor({ supplements }: { supplements: Supplement[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<SupplementInput[]>(
    supplements.map((s) => ({ id: s.id, name: s.name, dose: s.dose ?? "", time: s.time, active: s.active }))
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (i: number, patch: Partial<SupplementInput>) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = () =>
    startTransition(async () => {
      const res = await saveSupplements(rows);
      setMsg(res.ok ? "Saved." : res.error);
      if (res.ok) router.refresh();
    });

  return (
    <div>
      {rows.length > 0 && (
        <ul className="mb-3 space-y-2">
          {rows.map((r, i) => (
            <li key={r.id ?? `new-${i}`} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <input value={r.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Name, e.g. Creatine" className={inputCls} aria-label="Supplement name" />
              <button onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))} className="rounded p-1.5 text-gray-400 hover:text-red-600 sm:order-last" aria-label={`Remove ${r.name || "supplement"}`}>
                <X className="h-4 w-4" />
              </button>
              <input value={r.dose} onChange={(e) => update(i, { dose: e.target.value })} placeholder="Dose, e.g. 5 g" className={inputCls} aria-label="Dose" />
              <select value={r.time} onChange={(e) => update(i, { time: e.target.value })} className={inputCls} aria-label="When">
                {SUPPLEMENT_TIMES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setRows((prev) => [...prev, { name: "", dose: "", time: "morning", active: true }])} className={btnSecondary}>
          <Plus className="h-4 w-4" /> Add supplement
        </button>
        <button onClick={save} disabled={pending} className={btnPrimary}>{pending ? "Saving…" : "Save supplements"}</button>
        {msg && <span role="status" className="text-sm text-gray-500 dark:text-gray-400">{msg}</span>}
      </div>
    </div>
  );
}
