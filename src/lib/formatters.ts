import type { Appointment, NotificationLog } from "@prisma/client";
import { formatMonthDayTime } from "@/lib/date";

export function withHonorific(nameKana: string) {
  return nameKana.endsWith("様") ? nameKana : `${nameKana}様`;
}

function line(label: string, value: string | null | undefined) {
  return value ? `${label}：${value}` : null;
}

export function buildFormSubmittedMessage(appointment: Appointment) {
  const typeLabel = appointment.appointmentType ? `【${appointment.appointmentType}】` : "";
  const header = `${typeLabel}${formatMonthDayTime(appointment.visitAt)} ${appointment.age}${appointment.gender} ${withHonorific(appointment.nameKana)}`;

  const electricityLines =
    appointment.electricityCostHigh || appointment.electricityCostLow
      ? [
          line("電気代（High）", appointment.electricityCostHigh),
          line("電気代（Low）", appointment.electricityCostLow)
        ].filter(Boolean).join("\n")
      : line("電気代", appointment.electricityCost);

  const sellPowerLines =
    appointment.sellPowerHigh || appointment.sellPowerLow
      ? [
          line("売電（High）", appointment.sellPowerHigh),
          line("売電（Low）", appointment.sellPowerLow)
        ].filter(Boolean).join("\n")
      : line("売電", appointment.sellPower);

  const gasCostLines =
    appointment.gasCostHigh || appointment.gasCostLow
      ? [
          line("ガス代（High）", appointment.gasCostHigh),
          line("ガス代（Low）", appointment.gasCostLow)
        ].filter(Boolean).join("\n")
      : null;

  const parts = [
    header,
    "",
    `電話番号：${appointment.phoneNumber}`,
    `☎TEL日時：${formatMonthDayTime(appointment.telAt)}`,
    "",
    electricityLines,
    sellPowerLines,
    gasCostLines,
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
  return `${formatMonthDayTime(appointment.telAt)} ーーアポ ${withHonorific(appointment.nameKana)} TELの時間だよ！`;
}

export function notificationLabel(type: NotificationLog["type"]) {
  if (type === "form_submitted") return "Form送信直後";
  if (type === "tel_reminder") return "TELリマインド";
  return type;
}
