import { describe, expect, it } from "vitest";
import { buildFormSubmittedMessage, buildTelReminderMessage, withHonorific } from "@/lib/formatters";

const baseAppointment = {
  id: "appt_1",
  visitAt: new Date("2026-03-21T01:00:00.000Z"),
  telAt: new Date("2026-03-20T03:00:00.000Z"),
  age: 30,
  gender: "A",
  nameKana: "ミウラ",
  phoneNumber: "08083759395",
  electricityCost: "6000~15000円",
  sellPower: "3000〜8000円",
  panelYears: "5年目",
  gasOrEcoCute: "エコキュート",
  specialConditions: "",
  detail: "非常に温厚な夫婦だった。",
  selfCall: false,
  telReminderEnabled: true,
  telReminderSentAt: null,
  formNotificationSentAt: null,
  createdAt: new Date("2026-03-19T00:00:00.000Z"),
  updatedAt: new Date("2026-03-19T00:00:00.000Z"),
  deletedAt: null
};

describe("formatters", () => {
  it("adds honorific suffix only once", () => {
    expect(withHonorific("ミウラ")).toBe("ミウラ様");
    expect(withHonorific("ミウラ様")).toBe("ミウラ様");
  });

  it("builds form submitted message in the requested format", () => {
    const message = buildFormSubmittedMessage(baseAppointment);
    expect(message).toContain("3/21 10:00 30A ミウラ様");
    expect(message).toContain("電話番号：08083759395");
    expect(message).toContain("☎TEL日時：3/20 12:00");
    expect(message).toContain("詳細：");
  });

  it("builds tel reminder message", () => {
    expect(buildTelReminderMessage(baseAppointment)).toBe("3/20 12:00 ーーアポ ミウラ様 TELの時間だよ！");
  });
});
