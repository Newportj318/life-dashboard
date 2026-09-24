import type { Metadata } from "next";
import { CalendarClock, Landmark, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { Card, PageHeader, SetupNote, StatCard } from "@/components/dashboard";
import { attempt } from "@/lib/attempt";
import { LineChart, TableView } from "@/components/charts";
import { addDays, formatDay, today } from "@/lib/dates";
import {
  billsTotal,
  changeSince,
  money,
  monthlySeries,
  recordAndLoadSnapshots,
  summariseAccounts,
  upcomingBills,
} from "@/lib/finance";
import { getAccounts, getEvents, pocketsmithConfigured } from "@/lib/pocketsmith";

export const metadata: Metadata = { title: "Finances · Life Dashboard" };

const BILL_DAYS = 30;

const signed = (v: number) => `${v >= 0 ? "+" : "−"}${money(Math.abs(v))}`;

export default async function FinancesPage() {
  if (!pocketsmithConfigured()) {
    return (
      <>
        <PageHeader title="Finances" subtitle="Net worth, accounts and bills" />
        <SetupNote title="Connect PocketSmith">
          Add <code className="font-mono text-xs">POCKETSMITH_API_KEY</code> to <code className="font-mono text-xs">.env.local</code> (and Vercel), then restart. Create one in PocketSmith → Settings → Security &amp; Integrations → Developer keys.
        </SetupNote>
      </>
    );
  }

  const todayDay = today();
  const [accounts, events] = await Promise.all([
    attempt(getAccounts),
    attempt(() => getEvents(todayDay, addDays(todayDay, BILL_DAYS - 1))),
  ]);

  const summary = accounts.data ? summariseAccounts(accounts.data) : null;
  const snapshots = summary
    ? await attempt(() => recordAndLoadSnapshots(todayDay, summary.netWorth, summary.assets, summary.debts))
    : null;
  const bills = upcomingBills(events.data ?? []);
  const history = monthlySeries(snapshots?.data ?? []);
  const monthChange = summary && snapshots?.data ? changeSince(snapshots.data, addDays(todayDay, -30), summary.netWorth) : null;
  const yearChange = summary && snapshots?.data ? changeSince(snapshots.data, addDays(todayDay, -365), summary.netWorth) : null;

  const groupTotal = (key: string) => summary?.groups.find((g) => g.key === key)?.total ?? 0;
  const balanceDate = accounts.data?.map((a) => a.current_balance_date).sort().at(-1);

  return (
    <>
      <PageHeader title="Finances" subtitle="Net worth, accounts and bills" />

      {accounts.error && <SetupNote title="Couldn't reach PocketSmith">Check your API key is right. ({accounts.error})</SetupNote>}
      {snapshots?.error && (
        <SetupNote title="Net worth history not set up yet">
          Run <code className="font-mono text-xs">supabase/migrations/20260924_finances.sql</code> in the Supabase SQL Editor, then reload. ({snapshots.error})
        </SetupNote>
      )}

      {summary && (
        <div className="stagger mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={TrendingUp}
            accent="emerald"
            label="Net worth"
            value={money(summary.netWorth)}
            note={monthChange !== null ? `${signed(monthChange)} in 30 days` : "Change shows once history builds"}
          />
          <StatCard icon={Wallet} accent="emerald" label="Cash & savings" value={money(groupTotal("cash"))} note="Bank and cash accounts" />
          <StatCard icon={PiggyBank} accent="emerald" label="Investments & super" value={money(groupTotal("investments"))} note="Shares, super and insurance" />
          <StatCard
            icon={CalendarClock}
            accent="emerald"
            label="Bills next 7 days"
            value={money(billsTotal(bills, todayDay, 7))}
            note={`${money(billsTotal(bills, todayDay, BILL_DAYS))} over ${BILL_DAYS} days`}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Net worth over time">
            {history.length < 2 ? (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                The chart fills in as the dashboard records your net worth each day you visit.
              </p>
            ) : (
              <>
                {yearChange !== null && (
                  <p className="-mt-3 mb-4 text-sm text-gray-500 dark:text-gray-400">{signed(yearChange)} over the last 12 months</p>
                )}
                <LineChart
                  label="Net worth by month"
                  tone="emerald"
                  height={220}
                  format="money"
                  tick="compactMoney"
                  data={history.map((s) => ({ key: s.day, label: formatDay(s.day, { month: "short", year: "numeric" }), value: s.net_worth }))}
                />
                <TableView
                  columns={["Month", "Net worth"]}
                  format="money"
                  data={[...history].reverse().map((s) => ({ key: s.day, label: formatDay(s.day, { month: "long", year: "numeric" }), value: s.net_worth }))}
                />
              </>
            )}
          </Card>

          {summary && (
            <Card title="Accounts" action={balanceDate ? <span className="text-xs text-gray-500 dark:text-gray-400">As of {formatDay(balanceDate, { day: "numeric", month: "short" })}</span> : null}>
              <div className="space-y-6">
                {summary.groups
                  .filter((g) => g.items.length)
                  .map((g) => (
                    <div key={g.key}>
                      <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-gray-100 dark:border-white/[0.08] pb-2">
                        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{g.title}</h3>
                        <span className="text-sm font-semibold tabular-nums">{money(g.total)}</span>
                      </div>
                      <ul className="space-y-2">
                        {g.items.map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className={`truncate ${a.current_balance_in_base_currency === 0 ? "text-gray-400 dark:text-gray-500" : ""}`}>{a.title}</span>
                            <span className={`shrink-0 tabular-nums ${a.current_balance_in_base_currency < 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                              {money(a.current_balance_in_base_currency, { cents: true })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>

        <Card title="Upcoming bills" action={<span className="text-xs text-gray-500 dark:text-gray-400">Next {BILL_DAYS} days</span>}>
          {events.error ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Couldn&apos;t load bills. ({events.error})</p>
          ) : bills.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No bills in the next {BILL_DAYS} days.</p>
          ) : (
            <>
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {bills.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-[11px] uppercase text-gray-500 dark:text-gray-400">{formatDay(b.date, { weekday: "short" })}</p>
                      <p className="text-sm font-semibold">{formatDay(b.date, { day: "numeric", month: "short" })}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {[b.group, b.repeat].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">{money(b.amount, { cents: true })}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <Landmark className="h-3.5 w-3.5" /> From PocketSmith categories marked as bills.
              </p>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
