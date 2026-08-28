import { describe, expect, it } from "vitest";
import { parseAppointmentPayload } from "@/lib/validation";

type ParseResult = ReturnType<typeof parseAppointmentPayload>;

/** parseAppointmentPayload は失敗時に複数のエラー形を返すため、共通の形に均す */
function fieldErrorsOf(result: Extract<ParseResult, { success: false }>) {
  return result.error.flatten().fieldErrors as Partial<Record<string, string[]>>;
}

/** 現行スキーマで検証を通過する最小構成のペイロード */
const basePayload = {
  salesName: "ヤマダ",
  appointmentType: "蓄電池単体",
  visitAtDateInput: "2026-03-30",
  visitAtTimeInput: "10:00",
  telAtDateInput: "2026-03-29",
  telAtStartTimeInput: "18:00",
  telAtEndTimeInput: "20:00",
  age: "34",
  gender: "A",
  nameKana: "ミウラ",
  phoneNumber: "08012345678",
  coordinates: "35.6895,139.6917",
  selfCall: false
};

describe("parseAppointmentPayload", () => {
  it("accepts valid payload and derives reminder flag", () => {
    const result = parseAppointmentPayload(basePayload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe("34");
      expect(result.data.telReminderEnabled).toBe(true);
    }
  });

  it("年齢は自由入力を受け付ける", () => {
    for (const age of ["34", "60代", "30後半", "不明"]) {
      const result = parseAppointmentPayload({ ...basePayload, age });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.age).toBe(age);
    }
  });

  it("年齢が空なら必須エラー", () => {
    const result = parseAppointmentPayload({ ...basePayload, age: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsOf(result).age?.[0]).toContain("必須");
    }
  });

  it("rejects non-katakana names and non-digit phone numbers", () => {
    const result = parseAppointmentPayload({
      ...basePayload,
      nameKana: "三浦",
      phoneNumber: "080-1234-5678"
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrorsOf(result);
      expect(errors.nameKana?.[0]).toContain("カタカナ");
      expect(errors.phoneNumber?.[0]).toContain("10桁または11桁");
    }
  });

  it("座標・営業マン名は必須", () => {
    const result = parseAppointmentPayload({ ...basePayload, coordinates: "", salesName: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrorsOf(result);
      expect(errors.coordinates?.[0]).toContain("必須");
      expect(errors.salesName?.[0]).toContain("必須");
    }
  });

  it("disables reminder for self-call appointments", () => {
    const result = parseAppointmentPayload({ ...basePayload, gender: "AB", selfCall: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.telReminderEnabled).toBe(false);
    }
  });

  it("telSkip 時は翌日TELを立てずリマインドも無効化する", () => {
    const result = parseAppointmentPayload({
      ...basePayload,
      telSkip: true,
      telAtDateInput: "",
      telAtStartTimeInput: "",
      telAtEndTimeInput: ""
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.telAt).toBeNull();
      expect(result.data.telAtEnd).toBeNull();
      expect(result.data.telReminderEnabled).toBe(false);
    }
  });

  it("前日TEL日付が未入力なら訪問日の前日を既定値にする", () => {
    const result = parseAppointmentPayload(basePayload);

    expect(result.success).toBe(true);
    if (result.success) {
      // 訪問日 3/30 → 前日 3/29 18:00-20:00 JST
      expect(result.data.prevDayTelAt?.toISOString()).toBe("2026-03-29T09:00:00.000Z");
      expect(result.data.prevDayTelAtEnd?.toISOString()).toBe("2026-03-29T11:00:00.000Z");
    }
  });

  it("テレアポ時は TEL日時を訪問日時として扱いリマインドを無効化する", () => {
    const result = parseAppointmentPayload({
      ...basePayload,
      telAppointment: true,
      visitAtDateInput: "",
      visitAtTimeInput: "",
      telApptDateInput: "2026-03-30",
      telApptTimeInput: "10:00"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.visitAt.toISOString()).toBe("2026-03-30T01:00:00.000Z");
      expect(result.data.telAt).toBeNull();
      expect(result.data.telReminderEnabled).toBe(false);
    }
  });
});
