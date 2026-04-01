import type { Appointment, NotificationLog } from "@prisma/client";
import { formatMonthDayTime } from "@/lib/date";

export function withHonorific(nameKana: string) {
  return nameKana.endsWith("様") ? nameKana : `${nameKana}様`;
}

function line(label: string, value: string | null | undefined) {
  return value ? `${label}：${value}` : null;
}

function highLow(label: string, high: string | null | undefined, low: string | null | undefined) {
  if (high && low) return `${label}：${high}-${low}`;
  if (high) return `${label}：${high}`;
  if (low) return `${label}：${low}`;
  return null;
}

export function buildFormSubmittedMessage(appointment: Appointment) {
  const typeLabel = appointment.appointmentType === "その他"
    ? appointment.appointmentTypeOther || "その他"
    : appointment.appointmentType || "蓄電池単体";

  const salesName = appointment.salesName || "";

  const line1 = `【${typeLabel}】${salesName}アポ`;
  const line2 = `${formatMonthDayTime(appointment.visitAt)} ${appointment.age}${appointment.gender} ${withHonorific(appointment.nameKana)}`;

  const parts = [
    line1,
    line2,
    "",
    `電話番号：${appointment.phoneNumber}`,
    `☎TEL日時：${formatMonthDayTime(appointment.telAt)}`,
    "",
    highLow("電気代", appointment.electricityCostHigh, appointment.electricityCostLow),
    highLow("売電", appointment.sellPowerHigh, appointment.sellPowerLow),
    highLow("ガス代", appointment.gasCostHigh, appointment.gasCostLow),
    appointment.panelYears ? `パネル年数：${appointment.panelYears}年目` : null,
    line("給湯設備", appointment.gasOrEcoCute),
    line("ガス使用設備", appointment.gasUsageEquipment),
    line("⭐️特殊条件", appointment.specialConditions),
    "",
    appointment.detail ? `詳細：\n${appointment.detail}` : null
  ].filter((p) => p !== null && p !== undefined);

  return parts.join("\n");
}

export function buildTelReminderMessage(appointment: Appointment) {
  const salesName = appointment.salesName || "";
  return `${formatMonthDayTime(appointment.telAt)} ${salesName}アポ ${withHonorific(appointment.nameKana)} TELの時間だよ！`;
}

export function notificationLabel(type: NotificationLog["type"]) {
  if (type === "form_submitted") return "Form送信直後";
  if (type === "tel_reminder") return "TELリマインド";
  return type;
}
