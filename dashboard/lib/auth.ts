import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "niargus-dev-secret-change-me"
);

export interface Session {
  login: string;
  avatar: string;
  token: string;
}

export async function createSession(session: Session): Promise<string> {
  return new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("niargus_session")?.value;
  if (!jwt) return null;

  try {
    const { payload } = await jwtVerify(jwt, JWT_SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
