import { z } from "zod";
import { parseDateTimeInput, getDateMinusOne } from "@/lib/date";

const kataKanaRegex = /^[ァ-ヶー　\s]+$/;
const digitsRegex = /^\d+$/;
const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const appointmentFormSchema = z
  .object({
    visitAtDateInput: z.string().optional().default(""),
    visitAtTimeInput: z.string().optional().default(""),
    telAtDateInput: z.string().min(1, "TEL日（月/日）は必須です"),
    telAtStartTimeInput: z.string().min(1, "TEL開始時間は必須です"),
    telAtEndTimeInput: z.string().min(1, "TEL終了時間は必須です"),
    prevDayTelAtStartTimeInput: z.string().optional().default("18:00"),
    prevDayTelAtEndTimeInput: z.string().optional().default("20:00"),
    age: z.string().min(1, "年齢は必須です").regex(digitsRegex, "年齢は数字のみで入力してください"),
    gender: z.enum(["A", "B", "AB", "C"], {
      errorMap: () => ({ message: "性別を選択してください" })
    }),
    nameKana: z
      .string()
      .min(1, "名前は必須です")
      .regex(kataKanaRegex, "名前はカタカナで入力してください"),
    phoneNumber: z.string().min(1, "電話番号は必須です").regex(digitsRegex, "電話番号は数字のみで入力してください"),
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
    const visitDateInput = data.visitAtDateInput?.trim() ?? "";
    const visitTimeInput = data.visitAtTimeInput?.trim() ?? "";
    const visitIsEmpty = !visitDateInput && !visitTimeInput;

    if (!data.telAppointment) {
      if (!visitDateInput) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["visitAtDateInput"], message: "訪問日は必須です" });
      }
      if (!visitTimeInput) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["visitAtTimeInput"], message: "訪問時間は必須です" });
      }
    }

    if (!visitIsEmpty && visitDateInput && visitTimeInput) {
      if (!parseDateTimeInput(visitDateInput, visitTimeInput)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["visitAtDateInput"], message: "訪問日時を確認してください" });
      }
    }

    if (!data.telAtDateInput) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telAtDateInput"], message: "TEL日は必須です" });
    }
    if (!timePattern.test(data.telAtStartTimeInput)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telAtStartTimeInput"], message: "TEL開始時間はHH:mm形式で入力してください" });
    }
    if (!timePattern.test(data.telAtEndTimeInput)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telAtEndTimeInput"], message: "TEL終了時間はHH:mm形式で入力してください" });
    }
    if (data.telAtDateInput && data.telAtStartTimeInput) {
      if (!parseDateTimeInput(data.telAtDateInput, data.telAtStartTimeInput)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["telAtDateInput"], message: "TEL日時を確認してください" });
      }
    }
  });

export type AppointmentFormInput = z.input<typeof appointmentFormSchema>;

export function parseAppointmentPayload(input: unknown) {
  const parsed = appointmentFormSchema.safeParse(input);

  if (!parsed.success) {
    return parsed;
  }

  const visitAtDateInput = parsed.data.visitAtDateInput?.trim() ?? "";
  const visitAtTimeInput = parsed.data.visitAtTimeInput?.trim() ?? "";
  const visitAt =
    visitAtDateInput && visitAtTimeInput
      ? parseDateTimeInput(visitAtDateInput, visitAtTimeInput)
      : null;

  const telAt = parseDateTimeInput(parsed.data.telAtDateInput, parsed.data.telAtStartTimeInput);
  const telAtEnd = parseDateTimeInput(parsed.data.telAtDateInput, parsed.data.telAtEndTimeInput);

  if (!parsed.data.telAppointment && !visitAt) {
    return {
      success: false as const,
      error: {
        flatten: () => ({
          fieldErrors: { visitAtDateInput: ["訪問日時を確認してください"] }
        })
      }
    };
  }

  if (!telAt) {
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
  const baseDate = visitAt ?? telAt;
  const prevDayDateStr = getDateMinusOne(baseDate);
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
      visitAt: visitAt ?? telAt,
      telAt,
      telAtEnd,
      prevDayTelAt,
      prevDayTelAtEnd,
      telReminderEnabled: !parsed.data.selfCall && !parsed.data.telAppointment,
      salesName: parsed.data.salesName.trim()
    }
  };
}
