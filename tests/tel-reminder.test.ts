import { describe, expect, it } from "vitest";
import { addMinutes } from "date-fns";
import { getTelReminderWindow, isPrevDayTelDefaultTime, isTelReminderEligible } from "@/lib/tel-reminder";

const now = new Date("2026-03-26T12:00:00.000Z");
const nowWithSeconds = new Date("2026-03-26T12:00:45.000Z");

describe("tel reminder helpers", () => {
  it("creates a minute-aligned reminder window", () => {
    const { targetStart, targetEnd } = getTelReminderWindow(now);
    expect(targetStart.toISOString()).toBe("2026-03-26T12:04:00.000Z");
    expect(targetEnd.toISOString()).toBe("2026-03-26T12:05:59.999Z");
  });

  it("accepts appointments inside the window", () => {
    expect(
      isTelReminderEligible(
        {
          telAt: addMinutes(now, 5),
          selfCall: false,
          telReminderEnabled: true,
          telReminderSentAt: null,
          deletedAt: null
        },
        now
      )
    ).toBe(true);
  });

  it("accepts a target minute even when the job runs with seconds", () => {
    expect(
      isTelReminderEligible(
        {
          telAt: new Date("2026-03-26T12:05:00.000Z"),
          selfCall: false,
          telReminderEnabled: true,
          telReminderSentAt: null,
          deletedAt: null
        },
        nowWithSeconds
      )
    ).toBe(true);
  });

  it("rejects self-call, sent, deleted, or out-of-window appointments", () => {
    expect(
      isTelReminderEligible(
        {
          telAt: addMinutes(now, 5),
          selfCall: true,
          telReminderEnabled: true,
          telReminderSentAt: null,
          deletedAt: null
        },
        now
      )
    ).toBe(false);

    expect(
      isTelReminderEligible(
        {
          telAt: addMinutes(now, 5),
          selfCall: false,
          telReminderEnabled: true,
          telReminderSentAt: new Date(),
          deletedAt: null
        },
        now
      )
    ).toBe(false);

    expect(
      isTelReminderEligible(
        {
          telAt: addMinutes(now, 8),
          selfCall: false,
          telReminderEnabled: true,
          telReminderSentAt: null,
          deletedAt: null
        },
        now
      )
    ).toBe(false);

    expect(
      isTelReminderEligible(
        {
          telAt: new Date("2026-03-26T12:06:00.000Z"),
          selfCall: false,
          telReminderEnabled: true,
          telReminderSentAt: null,
          deletedAt: null
        },
        nowWithSeconds
      )
    ).toBe(false);
  });
});

// JST基準。訪問日は 2026-03-27
const visitAt = new Date("2026-03-27T01:00:00.000Z"); // JST 3/27 10:00

describe("isPrevDayTelDefaultTime", () => {
  it("前日18:00-20:00（デフォルト設定のまま）は true", () => {
    expect(
      isPrevDayTelDefaultTime(
        new Date("2026-03-26T09:00:00.000Z"), // JST 3/26 18:00
        new Date("2026-03-26T11:00:00.000Z"), // JST 3/26 20:00
        visitAt
      )
    ).toBe(true);
  });

  it("前日以外の18:00-20:00は false（通知対象）", () => {
    expect(
      isPrevDayTelDefaultTime(
        new Date("2026-03-25T09:00:00.000Z"), // JST 3/25 18:00（前々日）
        new Date("2026-03-25T11:00:00.000Z"),
        visitAt
      )
    ).toBe(false);

    expect(
      isPrevDayTelDefaultTime(
        new Date("2026-03-27T09:00:00.000Z"), // JST 3/27 18:00（当日）
        new Date("2026-03-27T11:00:00.000Z"),
        visitAt
      )
    ).toBe(false);
  });

  it("前日でも18:00-20:00以外は false（通知対象）", () => {
    expect(
      isPrevDayTelDefaultTime(
        new Date("2026-03-26T08:00:00.000Z"), // JST 3/26 17:00
        new Date("2026-03-26T11:00:00.000Z"),
        visitAt
      )
    ).toBe(false);
  });

  it("訪問日が無い場合は時間のみで判定", () => {
    expect(
      isPrevDayTelDefaultTime(
        new Date("2026-03-26T09:00:00.000Z"),
        new Date("2026-03-26T11:00:00.000Z"),
        null
      )
    ).toBe(true);
  });
});
