import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getAppSettings } from "@/lib/settings";

export async function POST() {
  const settings = await getAppSettings();

  if (env.lineMockMode) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      destinationId: settings.lineGroupId,
      message: "モック送信モードのため、実LINE送信は行わず疎通OKとして扱いました。"
    });
  }

  if (!env.lineChannelAccessToken) {
    return NextResponse.json(
      {
        ok: false,
        mode: "live",
        message: "LINE_CHANNEL_ACCESS_TOKEN が未設定です。"
      },
      { status: 400 }
    );
  }

  if (!settings.lineGroupId) {
    return NextResponse.json(
      {
        ok: false,
        mode: "live",
        message: "LINEグループIDが未設定です。"
      },
      { status: 400 }
    );
  }

  const response = await fetch("https://api.line.me/v2/bot/info", {
    headers: {
      Authorization: `Bearer ${env.lineChannelAccessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    return NextResponse.json(
      {
        ok: false,
        mode: "live",
        destinationId: settings.lineGroupId,
        message: `LINE API 認証に失敗しました: ${response.status} ${body}`
      },
      { status: 500 }
    );
  }

  const botInfo = await response.json();

  return NextResponse.json({
    ok: true,
    mode: "live",
    destinationId: settings.lineGroupId,
    message: "LINE API 認証に成功しました。グループID設定と組み合わせて送信準備OKです。",
    botInfo
  });
}
