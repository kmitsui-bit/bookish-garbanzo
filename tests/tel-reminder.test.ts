import { describe, expect, it } from "vitest";
import { addMinutes } from "date-fns";
import { getTelReminderWindow, isTelReminderEligible } from "@/lib/tel-reminder";

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
