import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "niargus_session";
export const OAUTH_STATE_COOKIE_NAME = "niargus_oauth_state";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;
const DEFAULT_RETURN_TO = "/dashboard";
const SHARED_AUTH_SECRET =
  process.env.JWT_SECRET ||
  process.env.GITHUB_CLIENT_SECRET ||
  "niargus-dev-secret-change-me";
const JWT_SECRET = new TextEncoder().encode(SHARED_AUTH_SECRET);

export interface Session {
  login: string;
  avatar: string;
  installationIds: number[];
}

interface SignedTokenPayload {
  exp: number;
}

export interface OAuthStatePayload extends SignedTokenPayload {
  nonce: string;
  returnTo: string;
}

export interface OAuthResultPayload extends SignedTokenPayload {
  login: string;
  avatar: string;
  installationIds: number[];
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
};

export const oauthStateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  path: "/",
};

function createSignedToken(payload: SignedTokenPayload & Record<string, unknown>) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", SHARED_AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifySignedToken<T extends SignedTokenPayload>(token: string): T | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", SHARED_AUTH_SECRET)
    .update(encodedPayload)
    .digest();
  const providedSignature = Buffer.from(signature, "base64url");

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as T;

    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function sanitizeReturnTo(returnTo?: string | null) {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return DEFAULT_RETURN_TO;
  }

  if (returnTo.startsWith("/api/auth/")) {
    return DEFAULT_RETURN_TO;
  }

  return returnTo;
}

export function createOAuthState(returnTo?: string | null) {
  return createSignedToken({
    nonce: randomBytes(16).toString("hex"),
    returnTo: sanitizeReturnTo(returnTo),
    exp: Date.now() + OAUTH_STATE_MAX_AGE_SECONDS * 1000,
  });
}

export function verifyOAuthState(token: string) {
  return verifySignedToken<OAuthStatePayload>(token);
}

export function verifyOAuthResultToken(token: string) {
  return verifySignedToken<OAuthResultPayload>(token);
}

export function getBackendUrl() {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3001"
  );
}

export async function createSession(session: Session): Promise<string> {
  return new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!jwt) return null;

  try {
    const { payload } = await jwtVerify(jwt, JWT_SECRET);

    const login = typeof payload.login === "string" ? payload.login : null;
    const avatar = typeof payload.avatar === "string" ? payload.avatar : "";
    const installationIds = Array.isArray(payload.installationIds)
      ? payload.installationIds
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
      : [];

    if (!login) {
      return null;
    }

    return { login, avatar, installationIds };
  } catch {
    return null;
  }
}
