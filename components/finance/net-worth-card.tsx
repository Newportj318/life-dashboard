"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { accents } from "@/lib/accents";
import { money } from "@/lib/format";

export type Baseline = { year: number; day: string; value: number; fromJan1: boolean };

const dayLabel = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("en-AU", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

/** Home stat card: net worth plus growth since 1 January of a chosen year (current year by default). */
export function NetWorthCard({ netWorth, baselines }: { netWorth: number | null; baselines: Baseline[] }) {
  const [year, setYear] = useState(baselines[0]?.year ?? null);
  const base = baselines.find((b) => b.year === year) ?? null;
  const change = netWorth != null && base ? netWorth - base.value : null;
  const pct = change != null && base && base.value !== 0 ? (change / Math.abs(base.value)) * 100 : null;
  const up = (change ?? 0) >= 0;
  const Trend = up ? TrendingUp : TrendingDown;
  const since = base ? (base.fromJan1 ? `1 Jan ${base.year}` : dayLabel(base.day)) : null;

  return (
    <div className="relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Whole card links to Finances; the year picker sits above the link. */}
      <Link href="/finances" className="absolute inset-0 rounded-xl" aria-label="Open Finances" />
      <div className={`mb-4 inline-flex rounded-lg p-2 ${accents.emerald.chip}`}>
        <Wallet className={`h-5 w-5 ${accents.emerald.icon}`} />
      </div>
      <h3 className="mb-1 font-medium text-gray-600 dark:text-gray-400">Net worth</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{netWorth != null ? money(netWorth) : "—"}</p>

      {pct != null && change != null ? (
        <div className="mt-1 text-sm">
          <p className={`inline-flex items-center gap-1 font-medium ${up ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            <Trend className="h-4 w-4" />
            {up ? "+" : "−"}
            {Math.abs(pct).toFixed(1)}% ({up ? "+" : "−"}{money(Math.abs(change))})
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            since{" "}
            {baselines.length > 1 ? (
              <select
                value={year ?? ""}
                onChange={(e) => setYear(Number(e.target.value))}
                className="relative z-10 rounded border border-gray-200 bg-transparent px-1 py-0.5 text-sm dark:border-gray-700"
                aria-label="Growth since"
              >
                {baselines.map((b) => (
                  <option key={b.year} value={b.year}>{b.fromJan1 ? `1 Jan ${b.year}` : dayLabel(b.day)}</option>
                ))}
              </select>
            ) : (
              since
            )}
          </p>
        </div>
      ) : (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{netWorth != null ? "Growth shows once history builds" : "Connect PocketSmith"}</p>
      )}
    </div>
  );
}
