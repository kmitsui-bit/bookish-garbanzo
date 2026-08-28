import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    timezone: "Asia/Tokyo",
    btLogApiUrl: "https://bt-log.example.com",
    btLogIntegrationToken: "test-token"
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
