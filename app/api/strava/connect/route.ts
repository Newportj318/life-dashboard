import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { STATE_COOKIE, stravaAuthorizeUrl, stravaConfigured } from "@/lib/strava";

// Sends you to Strava to approve access. Only reachable while logged in (see proxy.ts).
export async function GET(request: NextRequest) {
  if (!stravaConfigured()) {
    return NextResponse.redirect(new URL("/training?strava=not-configured", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = new URL("/api/strava/callback", request.nextUrl.origin).toString();
  const response = NextResponse.redirect(stravaAuthorizeUrl(redirectUri, state));
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/api/strava",
    maxAge: 600,
  });
  return response;
}
