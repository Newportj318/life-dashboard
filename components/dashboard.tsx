// Shared building blocks for every dashboard page, styled per DESIGN.md.

import Link from "next/link";
import { User, type LucideIcon } from "lucide-react";
import { accents, type Accent } from "@/lib/accents";
import { CountUp } from "@/components/count-up";
import { ThemeToggle } from "@/components/theme-toggle";

/** Square-ish button for week navigation and similar toolbars. */
export const navBtn =
  "inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06]";

export function PageHeader({ title, subtitle }: { title: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-gray-600 dark:text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle />
        <Link
          href="/settings"
          aria-label="Account"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.04] text-gray-600 backdrop-blur dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <User className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`surface rise p-6 ${className}`}
    >
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function CardLink({ href, accent, children }: { href: string; accent: Accent; children: React.ReactNode }) {
  return (
    <Link href={href} className={`shrink-0 whitespace-nowrap text-sm font-medium hover:underline ${accents[accent].text}`}>
      {children}
    </Link>
  );
}

export function StatCard({
  icon: Icon,
  accent,
  label,
  value,
  note,
  href,
}: {
  icon: LucideIcon;
  accent: Accent;
  label: string;
  value: string;
  note?: string;
  href?: string;
}) {
  const body = (
    <>
      <div className={`mb-4 inline-flex rounded-lg p-2 ${accents[accent].chip}`}>
        <Icon className={`h-5 w-5 ${accents[accent].icon}`} />
      </div>
      <h3 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">{label}</h3>
      <p className="stat-glow font-display text-2xl font-semibold tracking-tight text-gray-900 dark:text-white" style={{ "--glow": accents[accent].hex } as React.CSSProperties}>
        <CountUp text={value} />
      </p>
      {note && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{note}</p>}
    </>
  );
  const cls = "block surface surface-hover p-6";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function ProgressBar({ label, value, max, accent, suffix = "" }: {
  label: string;
  value: number;
  max: number;
  accent: Accent;
  suffix?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="truncate text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <span className="shrink-0 text-sm font-medium text-gray-900 dark:text-gray-100">
          {pct}%{suffix}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
        <div className={`bar-fill h-2 rounded-full ${accents[accent].bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Amber notice for a missing key, table or connection. */
export function SetupNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
      <p className="font-semibold">{title}</p>
      <p className="mt-0.5">{children}</p>
    </div>
  );
}

export function SampleBadge() {
  return (
    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
      Sample data
    </span>
  );
}

// Placeholder page body listing what each section will hold.
export function PlannedSections({
  accent,
  step,
  sections,
}: {
  accent: Accent;
  step: string;
  sections: { title: string; detail: string }[];
}) {
  return (
    <>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Coming in <span className={`font-medium ${accents[accent].text}`}>{step}</span> of the build.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title} title={s.title}>
            <p className="text-sm text-gray-600 dark:text-gray-400">{s.detail}</p>
            <div className="mt-5 h-24 rounded-lg border border-dashed border-gray-200 dark:border-white/[0.08]" />
          </Card>
        ))}
      </div>
    </>
  );
}
