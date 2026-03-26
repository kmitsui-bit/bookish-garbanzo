import { NextResponse } from "next/server";
import { extractGroupIds, parseLineWebhookPayload, syncWebhookGroupId, verifyLineWebhookSignature } from "@/lib/line-webhook";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineWebhookSignature(body, signature)) {
    console.error("[LINE WEBHOOK] invalid signature", {
      hasSignature: Boolean(signature)
    });
    return new NextResponse("invalid signature", { status: 401 });
  }

  const payload = parseLineWebhookPayload(body);
  const groupIds = extractGroupIds(payload);
  const eventSummary = (payload.events ?? []).map((event) => ({
    type: event.type,
    sourceType: event.source?.type ?? null,
    groupId: event.source?.groupId ?? null
  }));

  console.log("[LINE WEBHOOK] received", {
    eventCount: payload.events?.length ?? 0,
    groupIds,
    eventSummary
  });

  for (const groupId of groupIds) {
    const result = await syncWebhookGroupId(groupId);
    console.log("[LINE WEBHOOK] group detected", { groupId, result });
  }

  return NextResponse.json({
    ok: true,
    detectedGroupIds: groupIds
  });
}
