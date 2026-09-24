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
};

export const accents: Record<Accent, AccentClasses> = {
  blue: {
    chip: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    navSelected:
      "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500",
    bar: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  orange: {
    chip: "bg-orange-50 dark:bg-orange-900/20",
    icon: "text-orange-600 dark:text-orange-400",
    navSelected:
      "bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-l-2 border-orange-500",
    bar: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
  },
  green: {
    chip: "bg-green-50 dark:bg-green-900/20",
    icon: "text-green-600 dark:text-green-400",
    navSelected:
      "bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-l-2 border-green-500",
    bar: "bg-green-500",
    text: "text-green-600 dark:text-green-400",
  },
  purple: {
    chip: "bg-purple-50 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    navSelected:
      "bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-l-2 border-purple-500",
    bar: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
  },
  emerald: {
    chip: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: "text-emerald-600 dark:text-emerald-400",
    navSelected:
      "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-l-2 border-emerald-500",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    chip: "bg-amber-50 dark:bg-amber-900/20",
    icon: "text-amber-600 dark:text-amber-400",
    navSelected:
      "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-l-2 border-amber-500",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  sky: {
    chip: "bg-sky-50 dark:bg-sky-900/20",
    icon: "text-sky-600 dark:text-sky-400",
    navSelected:
      "bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-l-2 border-sky-500",
    bar: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
  },
  gray: {
    chip: "bg-gray-100 dark:bg-gray-800",
    icon: "text-gray-600 dark:text-gray-400",
    navSelected:
      "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-l-2 border-gray-500",
    bar: "bg-gray-500",
    text: "text-gray-600 dark:text-gray-400",
  },
};
