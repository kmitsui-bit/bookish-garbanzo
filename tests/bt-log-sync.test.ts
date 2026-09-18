import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    timezone: "Asia/Tokyo",
    btLogApiUrl: "https://bt-log.example.com",
    btLogIntegrationToken: "test-token",
    btLogOrgId: "11111111-2222-3333-4444-555555555555"
  }
}));

const baseParams = {
  appointmentId: "apt-1",
  staffName: "山田太郎",
  activityDate: new Date("2026-08-13T01:00:00Z"),
  telAppointment: false,
  gender: "male"
};

function jsonResponse(status: number) {
  return new Response(status === 204 ? null : "", { status });
}

describe("syncApoToActivityLog", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends once and reports success on 200", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse(200));

    const { syncApoToActivityLog } = await import("@/lib/bt-log-sync");
    const result = await syncApoToActivityLog(baseParams);

    expect(result).toEqual({ ok: true, skipped: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init!.body as string);
    expect(body).toMatchObject({
      idempotencyKey: "apo:apt-1",
      staffName: "山田太郎",
      activityDate: "2026-08-13",
      undo: false
    });
  });

  it("retries a 500 and succeeds on the second attempt", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(200));

    const { syncApoToActivityLog } = await import("@/lib/bt-log-sync");
    const result = await syncApoToActivityLog(baseParams);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 400 — the request itself is invalid", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse(400));

    const { syncApoToActivityLog } = await import("@/lib/bt-log-sync");
    const result = await syncApoToActivityLog(baseParams);

    expect(result).toMatchObject({ ok: false, attempts: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries network errors up to 3 attempts, then gives up", async () => {
    const fetchMock = vi.mocked(fetch).mockRejectedValue(new Error("ECONNRESET"));

    const { syncApoToActivityLog } = await import("@/lib/bt-log-sync");
    const result = await syncApoToActivityLog(baseParams);

    expect(result).toMatchObject({ ok: false, attempts: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("marks undo requests distinctly so they can be deduped separately", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(jsonResponse(200));

    const { undoApoSync } = await import("@/lib/bt-log-sync");
    await undoApoSync(baseParams);

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init!.body as string)).toMatchObject({
      idempotencyKey: "apo:apt-1:undo",
      undo: true
    });
  });
});

describe("fetchStaffNames", () => {
  beforeEach(() => {
    vi.resetModules(); // discoverOrgId のキャッシュをテスト間で持ち越さない
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const staffResponse = (names: string[]) =>
    Response.json({
      staff: names.map((displayName) => ({ displayName, isApoEnabled: true, department: "energy" }))
    });

  it("BT_LOG_ORG_ID が有効ならその orgId で取得する", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue(staffResponse(["山田太郎"]));

    const { fetchStaffNames } = await import("@/lib/bt-log-sync");
    const result = await fetchStaffNames();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/integrations/staff?");
    expect(String(url)).toContain("orgId=11111111-2222-3333-4444-555555555555");
    expect(result).toEqual({ names: ["山田太郎"], error: null });
  });

  it("BT_LOG_ORG_ID が誤っていても自動判別にフォールバックする", async () => {
    const fetchMock = vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      // 誤った orgId では 0 件
      if (url.includes("11111111-2222-3333-4444-555555555555")) return staffResponse([]);
      if (url.includes("/api/integrations/staff-revenue")) {
        return Response.json({
          staff: [
            { orgId: "99999999-aaaa-bbbb-cccc-dddddddddddd", department: "energy" },
            { orgId: "99999999-aaaa-bbbb-cccc-dddddddddddd", department: "energy" },
            { orgId: "00000000-0000-0000-0000-000000000000", department: "sales" }
          ]
        });
      }
      return staffResponse(["鈴木花子"]);
    });

    const { fetchStaffNames } = await import("@/lib/bt-log-sync");
    const result = await fetchStaffNames();

    // 自動判別した orgId で引き直している
    const lastUrl = String(fetchMock.mock.calls.at(-1)![0]);
    expect(lastUrl).toContain("orgId=99999999-aaaa-bbbb-cccc-dddddddddddd");
    expect(result).toEqual({ names: ["鈴木花子"], error: null });
  });

  it("取得できない場合は理由を返す", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("orgId は必須です。", { status: 400 }));

    const { fetchStaffNames } = await import("@/lib/bt-log-sync");
    const result = await fetchStaffNames();

    expect(result.names).toEqual([]);
    expect(result.error).toBeTruthy();
  });
});
