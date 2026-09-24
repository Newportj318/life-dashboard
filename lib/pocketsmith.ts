import "server-only";

// PocketSmith API v2. https://developers.pocketsmith.com
const BASE = "https://api.pocketsmith.com/v2";
const REVALIDATE_SECONDS = 300;

export type PsAccount = {
  id: number;
  title: string;
  type: string; // bank, cash, stocks, vehicle, property, credits, loans, mortgage, other_asset, other_liability…
  currency_code: string;
  current_balance: number;
  current_balance_in_base_currency: number;
  current_balance_date: string;
  include_in_net_worth?: boolean;
};

export type PsEvent = {
  id: string;
  amount: number;
  amount_in_base_currency: number;
  date: string;
  note: string | null;
  is_transfer: boolean;
  repeat_type: string;
  repeat_interval: number;
  category: { id: number; title: string; is_bill: boolean; is_transfer: boolean } | null;
  scenario: { account_id: number; title: string } | null;
};

export function pocketsmithConfigured() {
  return Boolean(process.env.POCKETSMITH_API_KEY);
}

async function psGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.POCKETSMITH_API_KEY;
  if (!key) throw new Error("POCKETSMITH_API_KEY is not set");
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { "X-Developer-Key": key, accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS, tags: ["pocketsmith"] },
  });
  if (!res.ok) throw new Error(`PocketSmith ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function getUserId() {
  const me = await psGet<{ id: number }>("/me");
  return me.id;
}

export async function getAccounts(): Promise<PsAccount[]> {
  return psGet<PsAccount[]>(`/users/${await getUserId()}/accounts`);
}

export async function getEvents(startDay: string, endDay: string): Promise<PsEvent[]> {
  return psGet<PsEvent[]>(`/users/${await getUserId()}/events`, { start_date: startDay, end_date: endDay });
}
