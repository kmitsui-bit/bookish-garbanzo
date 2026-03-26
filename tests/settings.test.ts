import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    appSetting: {
      findFirst: vi.fn()
    }
  }
}));

describe("getAppSettings", () => {
  it("falls back to env values when app settings are missing", async () => {
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.appSetting.findFirst).mockResolvedValueOnce(null);

    const { getAppSettings } = await import("@/lib/settings");
    const settings = await getAppSettings();

    expect(settings.lineGroupId).toBeTruthy();
    expect(settings.timezone).toBe("Asia/Tokyo");
  });
});
