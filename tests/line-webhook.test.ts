import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/settings", () => ({
  getAppSettings: vi.fn(async () => ({
    lineGroupId: "mock-line-group"
  })),
  upsertAppSettings: vi.fn(async ({ lineGroupId }: { lineGroupId: string }) => ({
    lineGroupId
  }))
}));

describe("line webhook helpers", () => {
  it("extracts unique group ids from events", async () => {
    const { extractGroupIds } = await import("@/lib/line-webhook");
    const groupIds = extractGroupIds({
      events: [
        { type: "message", source: { groupId: "group-a" } },
        { type: "join", source: { groupId: "group-a" } },
        { type: "message", source: { groupId: "group-b" } }
      ]
    });

    expect(groupIds).toEqual(["group-a", "group-b"]);
  });

  it("verifies webhook signatures", async () => {
    process.env.LINE_CHANNEL_SECRET = "secret";
    const body = JSON.stringify({ events: [] });
    const signature = crypto.createHmac("sha256", "secret").update(body).digest("base64");

    vi.resetModules();
    const { verifyLineWebhookSignature } = await import("@/lib/line-webhook");

    expect(verifyLineWebhookSignature(body, signature)).toBe(true);
    expect(verifyLineWebhookSignature(body, "bad-signature")).toBe(false);
  });
});
