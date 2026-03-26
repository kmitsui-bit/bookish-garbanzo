import { describe, expect, it } from "vitest";
import { formatMonthDayTime, parseMonthDayTime } from "@/lib/date";

describe("parseMonthDayTime", () => {
  it("parses valid month/day hour:minute input", () => {
    const date = parseMonthDayTime("03/21 10:00", new Date("2026-03-01T00:00:00+09:00"), "Asia/Tokyo");
    expect(date).not.toBeNull();
    expect(formatMonthDayTime(date!, "Asia/Tokyo")).toBe("3/21 10:00");
  });

  it("rejects impossible dates", () => {
    const date = parseMonthDayTime("02/30 10:00", new Date("2026-02-01T00:00:00+09:00"), "Asia/Tokyo");
    expect(date).toBeNull();
  });
});
