import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const staffName = request.nextUrl.searchParams.get("staffName") ?? "テスト";
  const gender = request.nextUrl.searchParams.get("gender") ?? "A";
  const scheduledVisit = request.nextUrl.searchParams.get("scheduledVisit") !== "false";
  const undo = request.nextUrl.searchParams.get("undo") === "true";

  if (!env.btLogApiUrl || !env.btLogIntegrationToken) {
    return NextResponse.json({ ok: false, reason: "env vars missing" });
  }

  const activityDate = new Date().toISOString().slice(0, 10);

  const body = {
    staffName,
    activityDate,
    telAppointment: false,
    gender,
    scheduledVisit,
    undo
  };

  const res = await fetch(`${env.btLogApiUrl}/api/integrations/apo-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.btLogIntegrationToken}`
    },
    body: JSON.stringify(body)
  }).catch((err) => ({ ok: false as const, status: 0, text: async () => String(err) }));

  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }

  return NextResponse.json({
    sentBody: body,
    response: { ok: res.ok, status: res.status, data }
  });
}
