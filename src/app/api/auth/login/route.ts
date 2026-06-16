import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import crypto from "node:crypto";

function timingSafeEqualStrings(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // 長さが違っても timing-safe に比較してから false を返す
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  // 起動時設定チェック
  if (!env.authPassword) {
    console.error("[AUTH] AUTH_PASSWORD is not configured");
    return NextResponse.json({ message: "サーバーの設定が不完全です" }, { status: 503 });
  }
  if (!env.authSecret || env.authSecret === "change-me-in-production") {
    console.error("[AUTH] AUTH_SECRET is not configured or is using the insecure default value");
    return NextResponse.json({ message: "サーバーの設定が不完全です" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "リクエストが不正です" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "リクエストが不正です" }, { status: 400 });
  }

  const { username, password } = body as Record<string, unknown>;

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ message: "IDまたはパスワードが正しくありません" }, { status: 401 });
  }

  const usernameOk = timingSafeEqualStrings(username, env.authUsername);
  const passwordOk = timingSafeEqualStrings(password, env.authPassword);

  if (!usernameOk || !passwordOk) {
    return NextResponse.json({ message: "IDまたはパスワードが正しくありません" }, { status: 401 });
  }

  const token = await createSessionToken(env.authSecret);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 // 24時間
  });

  return response;
}
