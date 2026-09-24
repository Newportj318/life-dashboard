// Small shared pieces for the meals and nutrition screens.

export const inputCls =
  "w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-2.5 py-1.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60";

export const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800";

export function fmtGrams(g: number) {
  return g >= 1000 ? `${(g / 1000).toLocaleString("en-AU", { maximumFractionDigits: 2 })} kg` : `${Math.round(g)} g`;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-xl sm:rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className={btnGhost} aria-label="Close">✕</button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
