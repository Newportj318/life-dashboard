import "server-only";
import { addDays } from "@/lib/dates";
import type { PsAccount, PsEvent } from "@/lib/pocketsmith";
import { createClient } from "@/lib/supabase/server";

export const money = (v: number, opts: { cents?: boolean } = {}) =>
  v.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });

/** "$587k", "$1.2M" for axes and tight spaces. */
export const compactMoney = (v: number) =>
  v.toLocaleString("en-AU", { style: "currency", currency: "AUD", notation: "compact", maximumFractionDigits: 1 });

export type GroupKey = "cash" | "investments" | "assets" | "debts";

export const GROUPS: { key: GroupKey; title: string }[] = [
  { key: "cash", title: "Cash & savings" },
  { key: "investments", title: "Investments & super" },
  { key: "assets", title: "Property & vehicles" },
  { key: "debts", title: "Debts" },
];

// PocketSmith account types → dashboard groups.
function groupOf(a: PsAccount): GroupKey {
  if (["credits", "loans", "mortgage", "other_liability"].includes(a.type)) return "debts";
  if (["stocks", "insurance"].includes(a.type)) return "investments";
  if (["property", "vehicle", "other_asset"].includes(a.type)) return "assets";
  return a.current_balance_in_base_currency < 0 ? "debts" : "cash";
}

export function summariseAccounts(accounts: PsAccount[]) {
  const counted = accounts.filter((a) => a.include_in_net_worth !== false);
  const groups = GROUPS.map((g) => {
    const items = counted
      .filter((a) => groupOf(a) === g.key)
      .sort((a, b) => a.title.localeCompare(b.title, "en-AU", { numeric: true }));
    return { ...g, items, total: items.reduce((s, a) => s + a.current_balance_in_base_currency, 0) };
  });
  const netWorth = counted.reduce((s, a) => s + a.current_balance_in_base_currency, 0);
  const debts = groups.find((g) => g.key === "debts")!.total;
  return { groups, netWorth, assets: netWorth - debts, debts };
}

export type Bill = {
  id: string;
  date: string;
  name: string;
  group: string | null;
  amount: number; // positive = money out
  account: string | null;
  repeat: string;
};

const REPEATS: Record<string, [label: string, unit: string]> = {
  once: ["One-off", ""],
  daily: ["Daily", "days"],
  weekly: ["Weekly", "weeks"],
  fortnightly: ["Fortnightly", "fortnights"],
  monthly: ["Monthly", "months"],
  yearly: ["Yearly", "years"],
  each_weekday: ["Weekdays", ""],
};

function repeatLabel(e: PsEvent) {
  const [label, unit] = REPEATS[e.repeat_type] ?? [e.repeat_type, ""];
  if (e.repeat_type === "weekly" && e.repeat_interval === 2) return "Fortnightly";
  return e.repeat_interval > 1 && unit ? `Every ${e.repeat_interval} ${unit}` : label;
}

/**
 * Bills are outgoing events whose category is marked "is bill" in PocketSmith,
 * excluding transfers between your own accounts. Untick "is bill" there to hide one.
 */
export function upcomingBills(events: PsEvent[]): Bill[] {
  return events
    .filter((e) => e.amount_in_base_currency < 0 && e.category?.is_bill && !e.is_transfer)
    .map((e) => {
      const title = e.category?.title ?? "Bill";
      const [group, name] = title.includes(" - ") ? title.split(/ - (.+)/) : [null, title];
      return {
        id: e.id,
        date: e.date,
        name: name || title,
        group,
        amount: -e.amount_in_base_currency,
        account: e.scenario?.title ?? null,
        repeat: repeatLabel(e),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || b.amount - a.amount);
}

export function billsTotal(bills: Bill[], fromDay: string, days: number) {
  const end = addDays(fromDay, days - 1);
  return bills.filter((b) => b.date >= fromDay && b.date <= end).reduce((s, b) => s + b.amount, 0);
}

export type Snapshot = { day: string; net_worth: number };

/** Records today's net worth (one row per day) and returns the full history. */
export async function recordAndLoadSnapshots(day: string, netWorth: number, assets: number, debts: number) {
  const supabase = await createClient();
  await supabase
    .from("net_worth_snapshots")
    .upsert({ day, net_worth: netWorth, assets, liabilities: debts, updated_at: new Date().toISOString() }, { onConflict: "user_id,day" });
  const { data, error } = await supabase.from("net_worth_snapshots").select("day, net_worth").order("day");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ day: r.day as string, net_worth: Number(r.net_worth) }));
}

/** One point per month (the last snapshot in it), plus the latest day. */
export function monthlySeries(snapshots: Snapshot[]) {
  const byMonth = new Map<string, Snapshot>();
  for (const s of snapshots) byMonth.set(s.day.slice(0, 7), s); // ordered by day, so last wins
  return [...byMonth.values()];
}

/** Net worth change since the last snapshot on or before `sinceDay`. */
export function changeSince(snapshots: Snapshot[], sinceDay: string, current: number) {
  const base = [...snapshots].reverse().find((s) => s.day <= sinceDay);
  return base ? current - base.net_worth : null;
}
