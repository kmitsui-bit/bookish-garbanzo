import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { fetchStaffNames } from "@/lib/bt-log-sync";

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

  const [rawRes, filteredNames] = await Promise.all([
    fetch(`${env.btLogApiUrl}/api/integrations/staff?status=active`, {
      headers: { "Authorization": `Bearer ${env.btLogIntegrationToken}` },
      cache: "no-store"
    }).then(async (r) => {
      const text = await r.text();
      let data: unknown;
      try { data = JSON.parse(text); } catch { data = text; }
      return { ok: r.ok, status: r.status, data };
    }).catch((err) => ({ ok: false, error: String(err) })),
    fetchStaffNames().catch(() => [])
  ]);

  return NextResponse.json({ rawApi: rawRes, filteredStaffNames: filteredNames });
}
