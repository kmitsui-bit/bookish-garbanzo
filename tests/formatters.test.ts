import { describe, expect, it } from "vitest";
import {
  buildFormSubmittedMessage,
  buildPrevDayTelReminderMessage,
  buildTelReminderMessage,
  withHonorific
} from "@/lib/formatters";

const baseAppointment = {
  id: "appt_1",
  visitAt: new Date("2026-03-21T01:00:00.000Z"), // 3/21 10:00 JST
  telAt: new Date("2026-03-20T03:00:00.000Z"), // 3/20 12:00 JST
  telAtEnd: new Date("2026-03-20T04:00:00.000Z"), // 3/20 13:00 JST
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
  // 旧カラム（現在フォーマッタは参照しない）
  electricityCost: null,
  sellPower: null,
  electricityCostHigh: "15000円",
  electricityCostLow: "6000円",
  sellPowerHigh: "8000円",
  sellPowerLow: "3000円",
  gasCostHigh: null,
  gasCostLow: null,
  gasUsageEquipment: null,
  panelYears: "5",
  gasOrEcoCute: "エコキュート",
  specialConditions: "",
  coordinates: null,
  detail: "非常に温厚な夫婦だった。",
  selfCall: false,
  telAppointment: false,
  telSkip: false,
  telReminderEnabled: true,
  telReminderSentAt: null,
  prevDayTelReminderSentAt: null,
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
    expect(message).toContain("【蓄電池単体】ヤマダアポ");
    expect(message).toContain("訪問日：3/21 10:00");
    expect(message).toContain("30A ミウラ様");
    expect(message).toContain("電話番号：080-8375-9395");
    expect(message).toContain("☎【翌日】TEL日時：3/20 12:00-13:00");
    expect(message).toContain("電気代：high 15000円 - low 6000円");
    expect(message).toContain("売電：high 8000円 - low 3000円");
    expect(message).toContain("パネル年数：5年目");
    expect(message).toContain("給湯設備：エコキュート");
    expect(message).toContain("詳細：\n非常に温厚な夫婦だった。");
  });

  it("パネル年数は自由入力でも「年目」が重複しない", () => {
    const panelYearsLine = (panelYears: string) =>
      buildFormSubmittedMessage({ ...baseAppointment, panelYears })
        .split("\n")
        .find((row) => row.startsWith("パネル年数："));

    expect(panelYearsLine("5")).toBe("パネル年数：5年目");
    expect(panelYearsLine("5年")).toBe("パネル年数：5年目");
    expect(panelYearsLine("5年目")).toBe("パネル年数：5年目");
    expect(panelYearsLine("不明")).toBe("パネル年数：不明");
    expect(panelYearsLine("")).toBeUndefined();
  });

  it("テレアポ時は【翌日】TELを出さない", () => {
    const message = buildFormSubmittedMessage({ ...baseAppointment, telSkip: true, telAppointment: true });
    expect(message).toContain("☎️テレアポ");
    expect(message).not.toContain("【翌日】TEL日時");
  });

  it("builds tel reminder message", () => {
    expect(buildTelReminderMessage(baseAppointment)).toBe(
      [
        "【翌日TEL】",
        "3/21 10:00 訪問予定",
        "3/20 12:00-13:00",
        "ヤマダアポ ミウラ様 TELの時間だよ！",
        "080-8375-9395"
      ].join("\n")
    );
  });

  it("builds prev day tel reminder message", () => {
    const appointment = {
      ...baseAppointment,
      prevDayTelAt: new Date("2026-03-20T10:00:00.000Z"), // 3/20 19:00 JST
      prevDayTelAtEnd: new Date("2026-03-20T12:00:00.000Z") // 3/20 21:00 JST
    };
    expect(buildPrevDayTelReminderMessage(appointment)).toBe(
      [
        "【前日TEL】",
        "3/21 10:00 訪問予定",
        "3/20 19:00-21:00",
        "ヤマダアポ ミウラ様 TELの時間だよ！",
        "080-8375-9395"
      ].join("\n")
    );
  });

  describe("前日TEL の ⚠️ マーク", () => {
    // visitAt は 3/21 10:00 JST なので、前日 = 3/20
    const withPrevDayTel = (start: string, end: string | null) => ({
      ...baseAppointment,
      prevDayTelAt: new Date(start),
      prevDayTelAtEnd: end ? new Date(end) : null
    });

    it("前日 かつ 18:00-20:00 なら付けない", () => {
      const message = buildFormSubmittedMessage(
        withPrevDayTel("2026-03-20T09:00:00.000Z", "2026-03-20T11:00:00.000Z")
      );
      expect(message).toContain("☎【前日】TEL日時：3/20 18:00-20:00");
      expect(message).not.toContain("⚠️");
    });

    it("時間帯がデフォルトと違うなら付ける", () => {
      const message = buildFormSubmittedMessage(
        withPrevDayTel("2026-03-20T10:00:00.000Z", "2026-03-20T12:00:00.000Z")
      );
      expect(message).toContain("⚠️☎【前日】TEL日時：3/20 19:00-21:00");
    });

    it("前日以外の日付なら 18:00-20:00 でも付ける", () => {
      const message = buildFormSubmittedMessage(
        withPrevDayTel("2026-03-19T09:00:00.000Z", "2026-03-19T11:00:00.000Z")
      );
      expect(message).toContain("⚠️☎【前日】TEL日時：3/19 18:00-20:00");
    });

    it("終了時刻が未設定なら付ける", () => {
      const message = buildFormSubmittedMessage(withPrevDayTel("2026-03-20T09:00:00.000Z", null));
      expect(message).toContain("⚠️☎【前日】TEL日時：3/20 18:00");
    });
  });
});
