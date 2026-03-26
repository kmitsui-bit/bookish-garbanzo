import crypto from "node:crypto";
import { env } from "@/lib/env";
import { getAppSettings, upsertAppSettings } from "@/lib/settings";

type LineWebhookEvent = {
  type: string;
  source?: {
    type?: string;
    groupId?: string;
    roomId?: string;
    userId?: string;
  };
};

type LineWebhookPayload = {
  destination?: string;
  events?: LineWebhookEvent[];
};

export function verifyLineWebhookSignature(body: string, signature: string | null) {
  if (!env.lineChannelSecret || !signature) {
    return false;
  }

  const digest = crypto.createHmac("sha256", env.lineChannelSecret).update(body).digest("base64");
  const left = Buffer.from(digest);
  const right = Buffer.from(signature);

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

export function parseLineWebhookPayload(body: string) {
  return JSON.parse(body) as LineWebhookPayload;
}

export function extractGroupIds(payload: LineWebhookPayload) {
  const groupIds = new Set<string>();

  for (const event of payload.events ?? []) {
    if (event.source?.groupId) {
      groupIds.add(event.source.groupId);
    }
  }

  return [...groupIds];
}

export async function syncWebhookGroupId(groupId: string) {
  try {
    const settings = await getAppSettings();
    const currentGroupId = settings.lineGroupId;

    if (!currentGroupId || currentGroupId === "mock-line-group") {
      await upsertAppSettings({ lineGroupId: groupId });
      return { updated: true, reason: "empty_or_placeholder" as const };
    }

    if (currentGroupId === groupId) {
      return { updated: false, reason: "already_set" as const };
    }

    return { updated: false, reason: "manual_override_kept" as const };
  } catch (error) {
    console.error("[LINE WEBHOOK] failed to sync group id", { groupId, error });
    return { updated: false, reason: "db_unavailable" as const };
  }
}

export function resolveAppBaseUrl(input?: string | null) {
  const baseUrl = input?.trim() || env.appBaseUrl;
  return baseUrl.replace(/\/$/, "");
}

export function buildWebhookUrl(baseUrl?: string | null) {
  return `${resolveAppBaseUrl(baseUrl)}/api/line/webhook`;
}
