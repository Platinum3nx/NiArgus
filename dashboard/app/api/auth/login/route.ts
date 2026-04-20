import { NextRequest, NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE_NAME,
  createOAuthState,
  getBackendUrl,
  oauthStateCookieOptions,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured." },
      { status: 500 }
    );
  }

  const state = createOAuthState(
    request.nextUrl.searchParams.get("returnTo") || "/dashboard"
  );
  const githubUrl = new URL("https://github.com/login/oauth/authorize");
  githubUrl.searchParams.set("client_id", clientId);
  githubUrl.searchParams.set(
    "redirect_uri",
    new URL("/auth/callback", getBackendUrl()).toString()
  );
  githubUrl.searchParams.set("scope", "read:user");
  githubUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubUrl);
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, oauthStateCookieOptions);
  return response;
}
