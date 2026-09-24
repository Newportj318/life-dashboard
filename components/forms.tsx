// Form controls shared by the Goals and Projects screens.

import type { Accent } from "@/lib/accents";

export const inputCls =
  "w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20";

const PRIMARY: Partial<Record<Accent, string>> = {
  amber: "bg-amber-600 hover:bg-amber-700",
  sky: "bg-sky-600 hover:bg-sky-700",
};

export const btnPrimary = (accent: Accent) =>
  `inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 ${PRIMARY[accent] ?? "bg-gray-800 hover:bg-gray-900"}`;

export const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-50";

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
    </label>
  );
}
