import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  if (!env.authSecret || env.authSecret === "change-me-in-production") {
    console.error("[AUTH] AUTH_SECRET is not configured or is using the insecure default value");
    return NextResponse.json({ message: "サーバーの設定が不完全です" }, { status: 503 });
  }
  if (!env.btLogApiUrl || !env.btLogIntegrationToken) {
    console.error("[AUTH] BT_LOG_API_URL or BT_LOG_INTEGRATION_TOKEN is not configured");
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

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ message: "メールアドレスとパスワードを入力してください" }, { status: 400 });
  }

  let verifyOk = false;
  let verifyReason: string | undefined;
  try {
    const res = await fetch(`${env.btLogApiUrl}/api/integrations/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.btLogIntegrationToken}`
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store"
    });

    const data = (await res.json()) as { ok?: boolean; reason?: string; retryAfterSeconds?: number };

    if (res.status === 429) {
      return NextResponse.json(
        { message: "ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。" },
        { status: 429 }
      );
    }

    verifyOk = !!data.ok;
    verifyReason = data.reason;
  } catch (err) {
    console.error("[AUTH] verify request failed:", err);
    return NextResponse.json({ message: "認証サービスに接続できません" }, { status: 503 });
  }

  if (!verifyOk) {
    const message =
      verifyReason === "department_not_allowed"
        ? "このアカウントはアクセス権限がありません"
        : "メールアドレスまたはパスワードが正しくありません";
    return NextResponse.json({ message }, { status: 401 });
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
