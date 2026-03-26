import { NextResponse } from "next/server";
import { extractGroupIds, parseLineWebhookPayload, syncWebhookGroupId, verifyLineWebhookSignature } from "@/lib/line-webhook";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineWebhookSignature(body, signature)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  const payload = parseLineWebhookPayload(body);
  const groupIds = extractGroupIds(payload);

  for (const groupId of groupIds) {
    const result = await syncWebhookGroupId(groupId);
    console.info("[LINE WEBHOOK] group detected", { groupId, result });
  }

  return NextResponse.json({
    ok: true,
    detectedGroupIds: groupIds
  });
}
