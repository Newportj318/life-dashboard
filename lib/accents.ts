// Fixed class lists per accent so Tailwind can see every class at build time.
// Never build these with template strings like `bg-${accent}-50`.

export type Accent =
  | "blue"
  | "orange"
  | "green"
  | "purple"
  | "emerald"
  | "amber"
  | "sky"
  | "gray";

type AccentClasses = {
  chip: string; // tinted icon background
  icon: string; // icon colour
  navSelected: string; // selected sidebar item
  bar: string; // progress bar fill
  text: string; // accent text / links
  hex: string; // for glows (CSS variables)
};

export const accents: Record<Accent, AccentClasses> = {
  blue: {
    chip: "bg-blue-50 ring-1 ring-blue-500/10 dark:bg-blue-500/15 dark:ring-blue-400/20",
    icon: "text-blue-600 dark:text-blue-300",
    navSelected:
      "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200 shadow-[inset_2px_0_0_rgb(59_130_246)] dark:shadow-[inset_2px_0_0_rgb(59_130_246),0_0_24px_-10px_rgb(59_130_246_/_0.9)]",
    bar: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
    hex: "#3b82f6",
  },
  orange: {
    chip: "bg-orange-50 ring-1 ring-orange-500/10 dark:bg-orange-500/15 dark:ring-orange-400/20",
    icon: "text-orange-600 dark:text-orange-300",
    navSelected:
      "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200 shadow-[inset_2px_0_0_rgb(249_115_22)] dark:shadow-[inset_2px_0_0_rgb(249_115_22),0_0_24px_-10px_rgb(249_115_22_/_0.9)]",
    bar: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    hex: "#f97316",
  },
  green: {
    chip: "bg-green-50 ring-1 ring-green-500/10 dark:bg-green-500/15 dark:ring-green-400/20",
    icon: "text-green-600 dark:text-green-300",
    navSelected:
      "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-200 shadow-[inset_2px_0_0_rgb(34_197_94)] dark:shadow-[inset_2px_0_0_rgb(34_197_94),0_0_24px_-10px_rgb(34_197_94_/_0.9)]",
    bar: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
    hex: "#22c55e",
  },
  purple: {
    chip: "bg-purple-50 ring-1 ring-purple-500/10 dark:bg-purple-500/15 dark:ring-purple-400/20",
    icon: "text-purple-600 dark:text-purple-300",
    navSelected:
      "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-200 shadow-[inset_2px_0_0_rgb(168_85_247)] dark:shadow-[inset_2px_0_0_rgb(168_85_247),0_0_24px_-10px_rgb(168_85_247_/_0.9)]",
    bar: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
    hex: "#a855f7",
  },
  emerald: {
    chip: "bg-emerald-50 ring-1 ring-emerald-500/10 dark:bg-emerald-500/15 dark:ring-emerald-400/20",
    icon: "text-emerald-600 dark:text-emerald-300",
    navSelected:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200 shadow-[inset_2px_0_0_rgb(16_185_129)] dark:shadow-[inset_2px_0_0_rgb(16_185_129),0_0_24px_-10px_rgb(16_185_129_/_0.9)]",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    hex: "#10b981",
  },
  amber: {
    chip: "bg-amber-50 ring-1 ring-amber-500/10 dark:bg-amber-500/15 dark:ring-amber-400/20",
    icon: "text-amber-600 dark:text-amber-300",
    navSelected:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200 shadow-[inset_2px_0_0_rgb(245_158_11)] dark:shadow-[inset_2px_0_0_rgb(245_158_11),0_0_24px_-10px_rgb(245_158_11_/_0.9)]",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    hex: "#f59e0b",
  },
  sky: {
    chip: "bg-sky-50 ring-1 ring-sky-500/10 dark:bg-sky-500/15 dark:ring-sky-400/20",
    icon: "text-sky-600 dark:text-sky-300",
    navSelected:
      "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200 shadow-[inset_2px_0_0_rgb(14_165_233)] dark:shadow-[inset_2px_0_0_rgb(14_165_233),0_0_24px_-10px_rgb(14_165_233_/_0.9)]",
    bar: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    hex: "#0ea5e9",
  },
  gray: {
    chip: "bg-slate-50 ring-1 ring-slate-500/10 dark:bg-slate-500/15 dark:ring-slate-400/20",
    icon: "text-slate-600 dark:text-slate-300",
    navSelected:
      "bg-slate-50 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200 shadow-[inset_2px_0_0_rgb(148_163_184)] dark:shadow-[inset_2px_0_0_rgb(148_163_184),0_0_24px_-10px_rgb(148_163_184_/_0.9)]",
    bar: "bg-slate-500",
    text: "text-slate-600 dark:text-slate-400",
    hex: "#94a3b8",
  },
};
