import { NextResponse, type NextRequest } from "next/server";
import { exchangeStravaCode, STATE_COOKIE, STRAVA_SCOPE } from "@/lib/strava";

// Strava redirects back here after you approve access.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const done = (result: string) => {
    const res = NextResponse.redirect(new URL(`/training?strava=${result}`, request.url));
    res.cookies.delete({ name: STATE_COOKIE, path: "/api/strava" });
    return res;
  };

  const state = params.get("state");
  if (!state || state !== request.cookies.get(STATE_COOKIE)?.value) return done("failed");
  if (params.get("error")) return done("denied");

  // Without activity:read_all we can't see private activities.
  const granted = (params.get("scope") ?? "").split(",");
  if (!STRAVA_SCOPE.split(",").every((s) => granted.includes(s))) return done("missing-scope");

  const code = params.get("code");
  if (!code) return done("failed");

  try {
    await exchangeStravaCode(code);
  } catch {
    return done("failed");
  }
  return done("connected");
}
