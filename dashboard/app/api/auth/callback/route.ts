import { NextRequest, NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createSession,
  oauthStateCookieOptions,
  sanitizeReturnTo,
  sessionCookieOptions,
  verifyOAuthResultToken,
  verifyOAuthState,
} from "@/lib/auth";

function buildFailedAuthResponse(request: NextRequest, returnTo?: string | null) {
  const target = sanitizeReturnTo(returnTo).startsWith("/dashboard")
    ? "/"
    : sanitizeReturnTo(returnTo);
  const response = NextResponse.redirect(new URL(target, request.url));

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

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const state = params.get("state");
  const auth = params.get("auth");
  const error = params.get("error");
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (!state || !storedState || storedState !== state) {
    return buildFailedAuthResponse(request);
  }

  const parsedState = verifyOAuthState(state);
  if (!parsedState) {
    return buildFailedAuthResponse(request);
  }

  if (error || !auth) {
    return buildFailedAuthResponse(request, parsedState.returnTo);
  }

  const authPayload = verifyOAuthResultToken(auth);
  if (!authPayload || !authPayload.login) {
    return buildFailedAuthResponse(request, parsedState.returnTo);
  }

  const jwt = await createSession({
    login: authPayload.login,
    avatar: authPayload.avatar || "",
    installationIds: authPayload.installationIds,
  });

  const response = NextResponse.redirect(
    new URL(parsedState.returnTo, request.url)
  );
  response.cookies.set(SESSION_COOKIE_NAME, jwt, sessionCookieOptions);
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
    ...oauthStateCookieOptions,
    maxAge: 0,
  });

  return response;
}
