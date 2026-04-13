import type { Appointment, NotificationLog } from "@prisma/client";
import { formatMonthDayTime, formatTimeOnly } from "@/lib/date";
import { formatInTimeZone } from "date-fns-tz";
import { env } from "@/lib/env";

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
}

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

function telTimeRange(start: Date | null | undefined, end: Date | null | undefined): string {
  if (!start) return "";
  const s = formatTimeOnly(start);
  const e = end ? formatTimeOnly(end) : "";
  return e ? `${s}-${e}` : s;
}

export function buildFormSubmittedMessage(appointment: Appointment) {
  const typeLabel = appointment.appointmentType === "その他"
    ? appointment.appointmentTypeOther || "その他"
    : appointment.appointmentType || "蓄電池単体";

  const salesName = appointment.salesName || "";

  const telAppoLabel = appointment.telAppointment ? " ☎️テレアポ" : "";
  const todayLabel = formatInTimeZone(new Date(), env.timezone, "MM/dd");
  const line1 = `${todayLabel}【${typeLabel}】${salesName}アポ${telAppoLabel}`;
  const line2 = `${formatMonthDayTime(appointment.visitAt)} ${appointment.age}${appointment.gender} ${withHonorific(appointment.nameKana)}`;

  const telNextDay = (appointment as { telSkip?: boolean }).telSkip
    ? "☎【翌日】TEL日時：不要"
    : appointment.telAt
      ? `☎【翌日】TEL日時：${formatMonthDayTime(appointment.telAt)} ${telTimeRange(appointment.telAt, appointment.telAtEnd)}`
      : null;

  const telPrevDay = appointment.prevDayTelAt
    ? `☎【前日】TEL日時：${formatMonthDayTime(appointment.prevDayTelAt)} ${telTimeRange(appointment.prevDayTelAt, appointment.prevDayTelAtEnd)}`
    : null;

  const parts = [
    line1,
    line2,
    "",
    `電話番号：${formatPhoneNumber(appointment.phoneNumber)}`,
    telNextDay,
    telPrevDay,
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
  const timeRange = telTimeRange(appointment.telAt, appointment.telAtEnd);
  return `${formatMonthDayTime(appointment.telAt)} ${timeRange} ${salesName}アポ ${withHonorific(appointment.nameKana)} TELの時間だよ！`;
}

export function buildPrevDayTelReminderMessage(appointment: Appointment) {
  const salesName = appointment.salesName || "";
  const timeRange = telTimeRange(appointment.prevDayTelAt, appointment.prevDayTelAtEnd);
  return `【前日TEL】${formatMonthDayTime(appointment.prevDayTelAt!)} ${timeRange} ${salesName}アポ ${withHonorific(appointment.nameKana)} TELの時間だよ！`;
}

export function notificationLabel(type: NotificationLog["type"]) {
  if (type === "form_submitted") return "Form送信直後";
  if (type === "tel_reminder") return "TELリマインド";
  if (type === "prev_day_tel_reminder") return "前日TELリマインド";
  return type;
}
