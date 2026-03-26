import { describe, expect, it } from "vitest";
import { normalizePage, pickLatestFailedRetries } from "@/lib/notification-queries";

describe("notification query helpers", () => {
  it("normalizes invalid pages to 1", () => {
    expect(normalizePage(undefined)).toBe(1);
    expect(normalizePage("0")).toBe(1);
    expect(normalizePage("-3")).toBe(1);
    expect(normalizePage("2.8")).toBe(2);
  });

  it("keeps only the latest failed log per appointment and type", () => {
    const picked = pickLatestFailedRetries([
      {
        id: "1",
        appointmentId: "appt_1",
        type: "form_submitted",
        status: "failed",
        createdAt: new Date("2026-03-26T12:00:00.000Z")
      },
      {
        id: "2",
        appointmentId: "appt_1",
        type: "form_submitted",
        status: "failed",
        createdAt: new Date("2026-03-26T13:00:00.000Z")
      },
      {
        id: "3",
        appointmentId: "appt_2",
        type: "tel_reminder",
        status: "failed",
        createdAt: new Date("2026-03-26T11:00:00.000Z")
      },
      {
        id: "4",
        appointmentId: "appt_2",
        type: "tel_reminder",
        status: "success",
        createdAt: new Date("2026-03-26T14:00:00.000Z")
      }
    ]);

    expect(picked).toHaveLength(2);
    expect(picked.map((item) => item.id)).toEqual(["2", "3"]);
  });
});
