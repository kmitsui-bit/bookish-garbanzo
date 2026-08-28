import { describe, expect, it } from "vitest";
import { appointmentsToCsv } from "@/lib/csv";

describe("appointmentsToCsv", () => {
  it("serializes appointments with headers", () => {
    const csv = appointmentsToCsv([
      {
        id: "appt_1",
        visitAt: new Date("2026-03-21T01:00:00.000Z"),
        telAt: new Date("2026-03-20T03:00:00.000Z"),
        telAtEnd: new Date("2026-03-20T04:00:00.000Z"),
        prevDayTelAt: null,
        prevDayTelAtEnd: null,
        appointmentType: "蓄電池単体",
        appointmentTypeOther: null,
        salesName: "ヤマダ",
        age: "30",
        gender: "A",
        genderDetail: null,
        nameKana: "ミウラ",
        phoneNumber: "08083759395",
        electricityCost: "6000円",
        sellPower: "3000円",
        electricityCostHigh: null,
        electricityCostLow: null,
        sellPowerHigh: null,
        sellPowerLow: null,
        gasCostHigh: null,
        gasCostLow: null,
        gasUsageEquipment: null,
        panelYears: "5年目",
        gasOrEcoCute: "エコキュート",
        specialConditions: "なし",
        coordinates: null,
        detail: "詳細テキスト",
        selfCall: false,
        telAppointment: false,
        telSkip: false,
        telReminderEnabled: true,
        telReminderSentAt: null,
        prevDayTelReminderSentAt: null,
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
