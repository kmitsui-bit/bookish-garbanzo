import { z } from "zod";
import { parseMonthDayTime } from "@/lib/date";

const kataKanaRegex = /^[ァ-ヶー　\s]+$/;
const digitsRegex = /^\d+$/;

export const appointmentFormSchema = z
  .object({
    visitAtInput: z.string().min(1, "訪問日時は必須です"),
    telAtInput: z.string().min(1, "TEL日時は必須です"),
    age: z.string().min(1, "年齢は必須です").regex(digitsRegex, "年齢は数字のみで入力してください"),
    gender: z.enum(["A", "B", "AB"], {
      errorMap: () => ({ message: "性別を選択してください" })
    }),
    nameKana: z
      .string()
      .min(1, "名前は必須です")
      .regex(kataKanaRegex, "名前はカタカナで入力してください"),
    phoneNumber: z.string().min(1, "電話番号は必須です").regex(digitsRegex, "電話番号は数字のみで入力してください"),
    electricityCost: z.string().optional().default(""),
    sellPower: z.string().optional().default(""),
    panelYears: z.string().optional().default(""),
    gasOrEcoCute: z.string().optional().default(""),
    specialConditions: z.string().optional().default(""),
    detail: z.string().optional().default(""),
    selfCall: z.boolean().optional().default(false)
  })
  .superRefine((data, ctx) => {
    if (!parseMonthDayTime(data.visitAtInput)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visitAtInput"],
        message: "訪問日時は mm/dd HH:mm 形式で入力してください"
      });
    }

    if (!parseMonthDayTime(data.telAtInput)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["telAtInput"],
        message: "TEL日時は mm/dd HH:mm 形式で入力してください"
      });
    }
  });

export type AppointmentFormInput = z.input<typeof appointmentFormSchema>;

export function parseAppointmentPayload(input: unknown) {
  const parsed = appointmentFormSchema.safeParse(input);

  if (!parsed.success) {
    return parsed;
  }

  const visitAt = parseMonthDayTime(parsed.data.visitAtInput);
  const telAt = parseMonthDayTime(parsed.data.telAtInput);

  if (!visitAt || !telAt) {
    return {
      success: false as const,
      error: {
        flatten: () => ({
          fieldErrors: {
            visitAtInput: visitAt ? [] : ["訪問日時を確認してください"],
            telAtInput: telAt ? [] : ["TEL日時を確認してください"]
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
      telReminderEnabled: !parsed.data.selfCall
    }
  };
}
