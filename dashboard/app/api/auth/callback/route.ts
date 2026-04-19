import { cookies } from "next/headers";
import { createSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const login = params.get("login");
  const avatar = params.get("avatar") || "";
  const token = params.get("token");

  if (!login || !token) {
    return new Response("Missing login or token", { status: 400 });
  }

  const jwt = await createSession({ login, avatar, token });

  const cookieStore = await cookies();
  cookieStore.set("niargus_session", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return Response.redirect(new URL("/dashboard", request.url));
}
