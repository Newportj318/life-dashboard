import "server-only";
import { secret } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// Strava API v3. Tokens live in the `integrations` table and are refreshed as needed.
const API = "https://www.strava.com/api/v3";
const OAUTH = "https://www.strava.com/oauth";
export const STRAVA_SCOPE = "read,activity:read_all";
export const STATE_COOKIE = "strava_oauth_state";

export type StravaActivity = {
  id: number;
  name: string;
  sport_type: string;
  start_date: string; // UTC
  distance: number; // metres
  moving_time: number; // seconds
  average_heartrate?: number;
  average_speed?: number; // m/s
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number };
};

export function stravaConfigured() {
  return Boolean(secret("STRAVA_CLIENT_ID") && secret("STRAVA_CLIENT_SECRET"));
}

export function stravaAuthorizeUrl(redirectUri: string, state: string) {
  const url = new URL(`${OAUTH}/authorize`);
  url.searchParams.set("client_id", secret("STRAVA_CLIENT_ID")!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", STRAVA_SCOPE);
  url.searchParams.set("state", state);
  return url.toString();
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${OAUTH}/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: secret("STRAVA_CLIENT_ID"),
      client_secret: secret("STRAVA_CLIENT_SECRET"),
      ...body,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strava token request failed: ${res.status}`);
  return res.json();
}

async function saveTokens(t: TokenResponse) {
  const supabase = await createClient();
  const row: Record<string, unknown> = {
    provider: "strava",
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: t.expires_at,
    updated_at: new Date().toISOString(),
  };
  if (t.athlete?.id) row.external_id = String(t.athlete.id);
  const { error } = await supabase.from("integrations").upsert(row, { onConflict: "user_id,provider" });
  if (error) throw new Error(`Saving Strava connection failed: ${error.message}`);
}

export async function exchangeStravaCode(code: string) {
  await saveTokens(await tokenRequest({ grant_type: "authorization_code", code }));
}

export async function disconnectStrava() {
  const supabase = await createClient();
  await supabase.from("integrations").delete().eq("provider", "strava");
}

/** A valid access token, refreshing it if it expires within 5 minutes. Null if not connected. */
async function getAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("integrations")
    .select("access_token, refresh_token, expires_at")
    .eq("provider", "strava")
    .maybeSingle();
  if (!data) return null;

  if (data.expires_at - 300 > Date.now() / 1000) return data.access_token;

  // Strava may rotate the refresh token, so always store the newest one.
  const fresh = await tokenRequest({ grant_type: "refresh_token", refresh_token: data.refresh_token });
  await saveTokens(fresh);
  return fresh.access_token;
}

export async function stravaConnected() {
  const supabase = await createClient();
  const { data } = await supabase.from("integrations").select("provider").eq("provider", "strava").maybeSingle();
  return Boolean(data);
}

/** Activities starting at or after `afterUnix`, newest first. Null if not connected. */
export async function getActivitiesSince(afterUnix: number): Promise<StravaActivity[] | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const out: StravaActivity[] = [];
  for (let page = 1; page <= 5; page++) {
    const url = new URL(`${API}/athlete/activities`);
    url.searchParams.set("after", String(afterUnix));
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    const res = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) throw new Error(`Strava activities failed: ${res.status}`);
    const items: StravaActivity[] = await res.json();
    out.push(...items);
    if (items.length < 100) break;
  }
  return out.sort((a, b) => b.start_date.localeCompare(a.start_date));
}

// Which planned cardio label an activity satisfies.
const FAMILIES: Record<string, string[]> = {
  Run: ["Run", "TrailRun", "VirtualRun"],
  Ride: ["Ride", "VirtualRide", "EBikeRide", "GravelRide", "MountainBikeRide", "EMountainBikeRide"],
  Swim: ["Swim"],
  Walk: ["Walk", "Hike"],
  Row: ["Rowing", "VirtualRow"],
};

export function activityMatches(label: string, sportType: string) {
  const family = FAMILIES[label];
  return family ? family.includes(sportType) : true; // "Cardio" matches anything
}
