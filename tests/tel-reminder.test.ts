import { describe, expect, it } from "vitest";
import { addMinutes } from "date-fns";
import { getTelReminderWindow, isTelReminderEligible } from "@/lib/tel-reminder";

const now = new Date("2026-03-26T12:00:00.000Z");

describe("tel reminder helpers", () => {
  it("creates a 4 to 6 minute window", () => {
    const { targetStart, targetEnd } = getTelReminderWindow(now);
    expect(targetStart.toISOString()).toBe("2026-03-26T12:04:00.000Z");
    expect(targetEnd.toISOString()).toBe("2026-03-26T12:06:00.000Z");
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
  });
});
