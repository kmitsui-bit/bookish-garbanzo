import { z } from "zod";
import { parseMonthDayTime } from "@/lib/date";

const kataKanaRegex = /^[ァ-ヶー　\s]+$/;
const digitsRegex = /^\d+$/;
const datePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])$/;
const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const appointmentFormSchema = z
  .object({
    visitAtDateInput: z.string().min(1, "訪問日（月/日）は必須です"),
    visitAtTimeInput: z.string().min(1, "訪問時間（HH:mm）は必須です"),
    telAtDateInput: z.string().min(1, "TEL日（月/日）は必須です"),
    telAtTimeInput: z.string().min(1, "TEL時間（HH:mm）は必須です"),
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
    appointmentType: z.enum(["蓄電池単体", "創蓄☀️"]).default("蓄電池単体")
  })
  .superRefine((data, ctx) => {
    const visitDateOk = datePattern.test(data.visitAtDateInput.trim());
    const visitTimeOk = timePattern.test(data.visitAtTimeInput.trim());

    if (!visitDateOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visitAtDateInput"],
        message: "訪問日は mm/dd 形式で入力してください"
      });
    }
    if (!visitTimeOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visitAtTimeInput"],
        message: "訪問時間は HH:mm 形式で入力してください"
      });
    }
    if (visitDateOk && visitTimeOk) {
      const combined = `${data.visitAtDateInput.trim()} ${data.visitAtTimeInput.trim()}`;
      if (!parseMonthDayTime(combined)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["visitAtDateInput"],
          message: "訪問日時を確認してください"
        });
      }
    }

    const telDateOk = datePattern.test(data.telAtDateInput.trim());
    const telTimeOk = timePattern.test(data.telAtTimeInput.trim());

    if (!telDateOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["telAtDateInput"],
        message: "TEL日は mm/dd 形式で入力してください"
      });
    }
    if (!telTimeOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["telAtTimeInput"],
        message: "TEL時間は HH:mm 形式で入力してください"
      });
    }
    if (telDateOk && telTimeOk) {
      const combined = `${data.telAtDateInput.trim()} ${data.telAtTimeInput.trim()}`;
      if (!parseMonthDayTime(combined)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["telAtDateInput"],
          message: "TEL日時を確認してください"
        });
      }
    }
  });

export type AppointmentFormInput = z.input<typeof appointmentFormSchema>;

export function parseAppointmentPayload(input: unknown) {
  const parsed = appointmentFormSchema.safeParse(input);

  if (!parsed.success) {
    return parsed;
  }

  const visitAt = parseMonthDayTime(`${parsed.data.visitAtDateInput} ${parsed.data.visitAtTimeInput}`);
  const telAt = parseMonthDayTime(`${parsed.data.telAtDateInput} ${parsed.data.telAtTimeInput}`);

  if (!visitAt || !telAt) {
    return {
      success: false as const,
      error: {
        flatten: () => ({
          fieldErrors: {
            visitAtDateInput: visitAt ? [] : ["訪問日時を確認してください"],
            telAtDateInput: telAt ? [] : ["TEL日時を確認してください"]
          }
        })
      }
    };
  }

  return {
    success: true as const,
    data: {
      ...parsed.data,
      age: Number(parsed.data.age),
      visitAt,
      telAt,
      telReminderEnabled: !parsed.data.selfCall && !parsed.data.telAppointment
    }
  };
}
