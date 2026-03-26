import { describe, expect, it } from "vitest";
import { parseAppointmentPayload } from "@/lib/validation";

describe("parseAppointmentPayload", () => {
  it("accepts valid payload and derives reminder flag", () => {
    const result = parseAppointmentPayload({
      visitAtInput: "03/30 10:00",
      telAtInput: "03/30 09:00",
      age: "34",
      gender: "A",
      nameKana: "ミウラ",
      phoneNumber: "08012345678",
      electricityCost: "",
      sellPower: "",
      panelYears: "",
      gasOrEcoCute: "",
      specialConditions: "",
      detail: "",
      selfCall: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(34);
      expect(result.data.telReminderEnabled).toBe(true);
    }
  });

  it("rejects non-katakana names and non-digit phone numbers", () => {
    const result = parseAppointmentPayload({
      visitAtInput: "03/30 10:00",
      telAtInput: "03/30 09:00",
      age: "34",
      gender: "A",
      nameKana: "三浦",
      phoneNumber: "080-1234-5678",
      selfCall: false
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.nameKana?.[0]).toContain("カタカナ");
      expect(errors.phoneNumber?.[0]).toContain("数字のみ");
    }
  });

  it("disables reminder for self-call appointments", () => {
    const result = parseAppointmentPayload({
      visitAtInput: "03/30 10:00",
      telAtInput: "03/30 09:00",
      age: "34",
      gender: "AB",
      nameKana: "ミウラ",
      phoneNumber: "08012345678",
      selfCall: true
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.telReminderEnabled).toBe(false);
    }
  });
});
