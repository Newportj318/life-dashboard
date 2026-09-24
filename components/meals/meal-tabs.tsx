"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/meals", label: "Week plan", match: (p: string) => p === "/meals" },
  { href: "/meals/library", label: "Library", match: (p: string) => p.startsWith("/meals/library") },
  { href: "/meals/shopping", label: "Shopping list", match: (p: string) => p.startsWith("/meals/shopping") },
];

export function MealTabs() {
  const pathname = usePathname();
  // Keep the selected week when switching between the plan and the shopping list.
  const week = useSearchParams().get("week");
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-white/[0.08]" aria-label="Meals">
      {TABS.map((t) => {
        const active = t.match(pathname);
        const href = week && t.href !== "/meals/library" ? `${t.href}?week=${week}` : t.href;
        return (
          <Link
            key={t.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-orange-500 text-orange-700 dark:text-orange-300"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
