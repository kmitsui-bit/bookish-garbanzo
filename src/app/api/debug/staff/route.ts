import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasUrl = !!env.btLogApiUrl;
  const hasToken = !!env.btLogIntegrationToken;

  if (!hasUrl || !hasToken) {
    return NextResponse.json({
      ok: false,
      reason: "env vars missing",
      btLogApiUrl: hasUrl,
      btLogIntegrationToken: hasToken
    });
  }

  try {
    const res = await fetch(`${env.btLogApiUrl}/api/integrations/staff?status=active`, {
      headers: { "Authorization": `Bearer ${env.btLogIntegrationToken}` }
    });

    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text; }

    return NextResponse.json({ ok: res.ok, status: res.status, data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
