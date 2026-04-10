import { z } from "zod";
import { parseDateTimeInput, getDateMinusOne } from "@/lib/date";

const kataKanaRegex = /^[ァ-ヶー　\s]+$/;
const digitsRegex = /^\d+$/;
const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const appointmentFormSchema = z
  .object({
    visitAtDateInput: z.string().optional().default(""),
    visitAtTimeInput: z.string().optional().default(""),
    telSkip: z.boolean().optional().default(false),
    telAtDateInput: z.string().optional().default(""),
    telAtStartTimeInput: z.string().optional().default(""),
    telAtEndTimeInput: z.string().optional().default(""),
    prevDayTelAtDateInput: z.string().optional().default(""),
    prevDayTelAtStartTimeInput: z.string().optional().default("18:00"),
    prevDayTelAtEndTimeInput: z.string().optional().default("20:00"),
    telApptDateInput: z.string().optional().default(""),
    telApptTimeInput: z.string().optional().default(""),
    age: z.string().min(1, "年齢は必須です").regex(digitsRegex, "年齢は数字のみで入力してください"),
    gender: z.enum(["A", "B", "AB", "C"], {
      errorMap: () => ({ message: "性別を選択してください" })
    }),
    nameKana: z
      .string()
      .min(1, "名前は必須です")
      .regex(kataKanaRegex, "名前はカタカナで入力してください"),
    phoneNumber: z
      .string()
      .min(1, "電話番号は必須です")
      .regex(/^\d{10,11}$/, "電話番号は10桁または11桁の数字で入力してください"),
    electricityCostHigh: z.string().optional().default(""),
    electricityCostLow: z.string().optional().default(""),
    sellPowerHigh: z.string().optional().default(""),
    sellPowerLow: z.string().optional().default(""),
    gasCostHigh: z.string().optional().default(""),
    gasCostLow: z.string().optional().default(""),
    gasUsageEquipment: z.string().optional().default(""),
    panelYears: z.string().optional().default(""),
    gasOrEcoCute: z.string().optional().default(""),
    specialConditions: z.string().optional().default(""),
    detail: z.string().optional().default(""),
    selfCall: z.boolean().optional().default(false),
    telAppointment: z.boolean().optional().default(false),
    appointmentType: z.enum(["蓄電池単体", "創蓄☀️", "その他"]).default("蓄電池単体"),
    appointmentTypeOther: z.string().optional().default(""),
    salesName: z.string().min(1, "営業マン名は必須です"),
    genderDetail: z.string().optional().default("")
  })
  .superRefine((data, ctx) => {
    if (data.telAppointment) {
      // テレアポモード: TEL日時のみ検証
      if (!data.telApptDateInput) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telApptDateInput"], message: "TEL日は必須です" });
      }
      if (!data.telApptTimeInput || !timePattern.test(data.telApptTimeInput)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telApptTimeInput"], message: "TEL時間はHH:mm形式で入力してください" });
      }
      if (data.telApptDateInput && data.telApptTimeInput) {
        if (!parseDateTimeInput(data.telApptDateInput, data.telApptTimeInput)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telApptDateInput"], message: "TEL日時を確認してください" });
        }
      }
      return;
    }

    const visitDateInput = data.visitAtDateInput?.trim() ?? "";
    const visitTimeInput = data.visitAtTimeInput?.trim() ?? "";
    const visitIsEmpty = !visitDateInput && !visitTimeInput;

    if (!visitDateInput) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["visitAtDateInput"], message: "訪問日は必須です" });
    }
    if (!visitTimeInput) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["visitAtTimeInput"], message: "訪問時間は必須です" });
    }

    if (!visitIsEmpty && visitDateInput && visitTimeInput) {
      if (!parseDateTimeInput(visitDateInput, visitTimeInput)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["visitAtDateInput"], message: "訪問日時を確認してください" });
      }
    }

    if (!data.telSkip) {
      if (!data.telAtDateInput) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telAtDateInput"], message: "TEL日は必須です" });
      }
      if (!timePattern.test(data.telAtStartTimeInput ?? "")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telAtStartTimeInput"], message: "TEL開始時間はHH:mm形式で入力してください" });
      }
      if (!timePattern.test(data.telAtEndTimeInput ?? "")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telAtEndTimeInput"], message: "TEL終了時間はHH:mm形式で入力してください" });
      }
      if (data.telAtDateInput && data.telAtStartTimeInput) {
        if (!parseDateTimeInput(data.telAtDateInput, data.telAtStartTimeInput)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telAtDateInput"], message: "TEL日時を確認してください" });
        }
      }
    }

    if (data.prevDayTelAtDateInput && data.prevDayTelAtStartTimeInput) {
      if (!parseDateTimeInput(data.prevDayTelAtDateInput, data.prevDayTelAtStartTimeInput)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["prevDayTelAtDateInput"], message: "前日TEL日時を確認してください" });
      }
    }

    if (data.prevDayTelAtDateInput && data.prevDayTelAtEndTimeInput) {
      if (!parseDateTimeInput(data.prevDayTelAtDateInput, data.prevDayTelAtEndTimeInput)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["prevDayTelAtDateInput"], message: "前日TEL終了日時を確認してください" });
      }
    }
  });

export type AppointmentFormInput = z.input<typeof appointmentFormSchema>;

export function parseAppointmentPayload(input: unknown) {
  const parsed = appointmentFormSchema.safeParse(input);

  if (!parsed.success) {
    return parsed;
  }

  // テレアポモード
  if (parsed.data.telAppointment) {
    const telApptDate = parsed.data.telApptDateInput?.trim() ?? "";
    const telApptTime = parsed.data.telApptTimeInput?.trim() ?? "";
    const telApptAt = telApptDate && telApptTime ? parseDateTimeInput(telApptDate, telApptTime) : null;
    if (!telApptAt) {
      return {
        success: false as const,
        error: {
          flatten: () => ({
            fieldErrors: { telApptDateInput: ["TEL日時を確認してください"] }
          })
        }
      };
    }
    return {
      success: true as const,
      data: {
        ...parsed.data,
        age: Number(parsed.data.age),
        visitAt: telApptAt,
        telAt: null,
        telAtEnd: null,
        prevDayTelAt: null,
        prevDayTelAtEnd: null,
        telReminderEnabled: false,
        salesName: parsed.data.salesName.trim()
      }
    };
  }

  const visitAtDateInput = parsed.data.visitAtDateInput?.trim() ?? "";
  const visitAtTimeInput = parsed.data.visitAtTimeInput?.trim() ?? "";
  const visitAt =
    visitAtDateInput && visitAtTimeInput
      ? parseDateTimeInput(visitAtDateInput, visitAtTimeInput)
      : null;

  const telAt = parsed.data.telSkip
    ? null
    : parseDateTimeInput(parsed.data.telAtDateInput ?? "", parsed.data.telAtStartTimeInput ?? "");
  const telAtEnd = parsed.data.telSkip
    ? null
    : parseDateTimeInput(parsed.data.telAtDateInput ?? "", parsed.data.telAtEndTimeInput ?? "");

  if (!visitAt) {
    return {
      success: false as const,
      error: {
        flatten: () => ({
          fieldErrors: { visitAtDateInput: ["訪問日時を確認してください"] }
        })
      }
    };
  }

  if (!parsed.data.telSkip && !telAt) {
    return {
      success: false as const,
      error: {
        flatten: () => ({
          fieldErrors: { telAtDateInput: ["TEL日時を確認してください"] }
        })
      }
    };
  }

  // 前日TEL: visitAt - 1日
  const baseDate = visitAt ?? telAt ?? new Date();
  const prevDayDateStr = parsed.data.prevDayTelAtDateInput?.trim() || getDateMinusOne(baseDate);
  const prevDayTelAt = parsed.data.prevDayTelAtStartTimeInput
    ? parseDateTimeInput(prevDayDateStr, parsed.data.prevDayTelAtStartTimeInput)
    : null;
  const prevDayTelAtEnd = parsed.data.prevDayTelAtEndTimeInput
    ? parseDateTimeInput(prevDayDateStr, parsed.data.prevDayTelAtEndTimeInput)
    : null;

  return {
    success: true as const,
    data: {
      ...parsed.data,
      age: Number(parsed.data.age),
      visitAt: visitAt ?? telAt ?? new Date(),
      telAt,
      telAtEnd,
      prevDayTelAt,
      prevDayTelAtEnd,
      telReminderEnabled: !parsed.data.selfCall && !parsed.data.telSkip,
      salesName: parsed.data.salesName.trim()
    }
  };
}
