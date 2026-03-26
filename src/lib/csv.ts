import type { Appointment } from "@prisma/client";
import { formatCreatedAt, formatMonthDayTime } from "@/lib/date";

const headers = [
  "作成日時",
  "訪問日時",
  "TEL日時",
  "名前",
  "年齢",
  "性別",
  "電話番号",
  "電気代",
  "売電",
  "パネル年数",
  "ガスorエコキュート",
  "自分でTEL",
  "特殊条件",
  "詳細",
  "通知ステータス",
  "TEL通知対象",
  "更新日時"
];

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function appointmentsToCsv(appointments: Appointment[]) {
  const rows = appointments.map((appointment) => [
    formatCreatedAt(appointment.createdAt),
    formatMonthDayTime(appointment.visitAt),
    formatMonthDayTime(appointment.telAt),
    `${appointment.nameKana}様`,
    String(appointment.age),
    appointment.gender,
    appointment.phoneNumber,
    appointment.electricityCost ?? "",
    appointment.sellPower ?? "",
    appointment.panelYears ?? "",
    appointment.gasOrEcoCute ?? "",
    appointment.selfCall ? "ON" : "OFF",
    appointment.specialConditions ?? "",
    appointment.detail ?? "",
    appointment.formNotificationSentAt ? "送信済み" : "未送信",
    !appointment.selfCall && appointment.telReminderEnabled ? "対象" : "対象外",
    formatCreatedAt(appointment.updatedAt)
  ]);

  return [headers, ...rows].map((row) => row.map((value) => escapeCsv(String(value))).join(",")).join("\n");
}
