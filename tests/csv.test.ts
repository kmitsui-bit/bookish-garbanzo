import { describe, expect, it } from "vitest";
import { appointmentsToCsv } from "@/lib/csv";

describe("appointmentsToCsv", () => {
  it("serializes appointments with headers", () => {
    const csv = appointmentsToCsv([
      {
        id: "appt_1",
        visitAt: new Date("2026-03-21T01:00:00.000Z"),
        telAt: new Date("2026-03-20T03:00:00.000Z"),
        age: 30,
        gender: "A",
        nameKana: "ミウラ",
        phoneNumber: "08083759395",
        electricityCost: "6000円",
        sellPower: "3000円",
        panelYears: "5年目",
        gasOrEcoCute: "エコキュート",
        specialConditions: "なし",
        detail: "詳細テキスト",
        selfCall: false,
        telReminderEnabled: true,
        telReminderSentAt: null,
        formNotificationSentAt: new Date("2026-03-19T00:00:00.000Z"),
        createdAt: new Date("2026-03-19T00:00:00.000Z"),
        updatedAt: new Date("2026-03-19T00:00:00.000Z"),
        deletedAt: null
      }
    ]);

    expect(csv).toContain('"作成日時"');
    expect(csv).toContain('"ミウラ様"');
    expect(csv).toContain('"送信済み"');
    expect(csv).toContain('"対象"');
  });
});
