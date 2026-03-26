import type { Appointment, NotificationLog } from "@prisma/client";
import { formatMonthDayTime } from "@/lib/date";

export function withHonorific(nameKana: string) {
  return nameKana.endsWith("様") ? nameKana : `${nameKana}様`;
}

export function buildFormSubmittedMessage(appointment: Appointment) {
  return `${formatMonthDayTime(appointment.visitAt)} ${appointment.age}${appointment.gender} ${withHonorific(appointment.nameKana)}

電話番号：${appointment.phoneNumber}
☎TEL日時：${formatMonthDayTime(appointment.telAt)}

電気代：${appointment.electricityCost ?? ""}
売電：${appointment.sellPower ?? ""}
パネル年数：${appointment.panelYears ?? ""}
ガスorエコキュート：${appointment.gasOrEcoCute ?? ""}
⭐️特殊条件：${appointment.specialConditions ?? ""}

詳細：
${appointment.detail ?? ""}`;
}

export function buildTelReminderMessage(appointment: Appointment) {
  return `${formatMonthDayTime(appointment.telAt)} ーーアポ ${withHonorific(appointment.nameKana)} TELの時間だよ！`;
}

export function notificationLabel(type: NotificationLog["type"]) {
  if (type === "form_submitted") return "Form送信直後";
  if (type === "tel_reminder") return "TELリマインド";
  return type;
}
