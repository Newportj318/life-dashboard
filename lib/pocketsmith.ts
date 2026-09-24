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

async function psFetch(url: URL) {
  const key = process.env.POCKETSMITH_API_KEY;
  if (!key) throw new Error("POCKETSMITH_API_KEY is not set");
  const res = await fetch(url, {
    headers: { "X-Developer-Key": key, accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS, tags: ["pocketsmith"] },
  });
  if (!res.ok) throw new Error(`PocketSmith ${url.pathname} failed: ${res.status}`);
  return res;
}

function buildUrl(path: string, params: Record<string, string>) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url;
}

async function psGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  return (await psFetch(buildUrl(path, params))).json() as Promise<T>;
}

/** List endpoints return 30 items a page; follow the Link header's rel="next" to the end. */
async function psGetAll<T>(path: string, params: Record<string, string> = {}, maxPages = 20): Promise<T[]> {
  const out: T[] = [];
  let url: URL | null = buildUrl(path, params);
  for (let page = 0; url && page < maxPages; page++) {
    const res = await psFetch(url);
    out.push(...((await res.json()) as T[]));
    const next = res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? new URL(next[1]) : null;
  }
  return out;
}

async function getUserId() {
  const me = await psGet<{ id: number }>("/me");
  return me.id;
}

export async function getAccounts(): Promise<PsAccount[]> {
  return psGetAll<PsAccount>(`/users/${await getUserId()}/accounts`);
}

export async function getEvents(startDay: string, endDay: string): Promise<PsEvent[]> {
  return psGetAll<PsEvent>(`/users/${await getUserId()}/events`, { start_date: startDay, end_date: endDay });
}
