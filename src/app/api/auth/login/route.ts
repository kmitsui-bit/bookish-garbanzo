import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (username !== env.authUsername || password !== env.authPassword) {
    return NextResponse.json({ message: "IDまたはパスワードが正しくありません" }, { status: 401 });
  }

  const token = await createSessionToken(env.authSecret);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7 // 1週間
  });

  return response;
}
