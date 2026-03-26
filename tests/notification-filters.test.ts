import { describe, expect, it } from "vitest";
import { buildNotificationLogWhereInput } from "@/lib/notification-filters";

describe("buildNotificationLogWhereInput", () => {
  it("builds type and status filters", () => {
    expect(buildNotificationLogWhereInput({ type: "tel_reminder", status: "failed" })).toEqual({
      type: "tel_reminder",
      status: "failed"
    });
  });

  it("adds OR search conditions when keyword exists", () => {
    const where = buildNotificationLogWhereInput({ q: "ミウラ" });
    expect(Array.isArray(where.OR)).toBe(true);
    expect(where.OR).toHaveLength(4);
  });
});
