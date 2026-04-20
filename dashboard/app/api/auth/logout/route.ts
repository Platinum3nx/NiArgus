import { NextRequest, NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  oauthStateCookieOptions,
  sessionCookieOptions,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
    ...oauthStateCookieOptions,
    maxAge: 0,
  });

  return response;
}
