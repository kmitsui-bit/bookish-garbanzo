import type { Appointment, NotificationLog } from "@prisma/client";
import { formatMonthDayTime, formatTimeOnly } from "@/lib/date";
import { formatInTimeZone } from "date-fns-tz";
import { env } from "@/lib/env";
import { isPrevDayTelDefaultTime } from "@/lib/tel-reminder";

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
  if (high && low) return `${label}：high ${high} - low ${low}`;
  if (high) return `${label}：${high}`;
  if (low) return `${label}：${low}`;
  return null;
}

/**
 * パネル年数は自由入力のため、「5」でも「5年目」でも「5年目」に揃える。
 * （末尾が「年目」「年」以外の自由記述はそのまま表示する）
 */
function formatPanelYears(panelYears: string | null | undefined): string | null {
  const value = panelYears?.trim();
  if (!value) return null;
  if (value.endsWith("年目")) return value;
  if (value.endsWith("年")) return `${value}目`;
  if (/^\d+$/.test(value)) return `${value}年目`;
  return value;
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
  const line1 = `【${typeLabel}】${salesName}アポ${telAppoLabel}`;
  const line2 = `獲得日：${todayLabel}`;
  const line3 = `訪問日：${formatMonthDayTime(appointment.visitAt)}`;
  const line4 = `${appointment.age}${appointment.gender} ${withHonorific(appointment.nameKana)}`;

  const telAtDate = appointment.telAt ? formatInTimeZone(appointment.telAt, env.timezone, "M/d") : null;
  const telNextDay = (appointment as { telSkip?: boolean }).telSkip
    ? null
    : appointment.telAt && telAtDate
      ? `☎【翌日】TEL日時：${telAtDate} ${telTimeRange(appointment.telAt, appointment.telAtEnd)}`
      : null;

  const prevDayDate = appointment.prevDayTelAt ? formatInTimeZone(appointment.prevDayTelAt, env.timezone, "M/d") : null;
  // 前日以外の日付、またはデフォルトの 18:00-20:00 以外の時間帯なら ⚠️ を付けて目立たせる
  const prevDayWarn = appointment.prevDayTelAt
    && !isPrevDayTelDefaultTime(appointment.prevDayTelAt, appointment.prevDayTelAtEnd, appointment.visitAt)
    ? "⚠️" : "";
  const telPrevDay = appointment.prevDayTelAt && prevDayDate
    ? `${prevDayWarn}☎【前日】TEL日時：${prevDayDate} ${telTimeRange(appointment.prevDayTelAt, appointment.prevDayTelAtEnd)}`
    : null;

  const parts = [
    line1,
    line2,
    line3,
    line4,
    "",
    `電話番号：${formatPhoneNumber(appointment.phoneNumber)}`,
    telNextDay,
    telPrevDay,
    "",
    highLow("電気代", appointment.electricityCostHigh, appointment.electricityCostLow),
    highLow("売電", appointment.sellPowerHigh, appointment.sellPowerLow),
    highLow("ガス代", appointment.gasCostHigh, appointment.gasCostLow),
    line("パネル年数", formatPanelYears(appointment.panelYears)),
    line("給湯設備", appointment.gasOrEcoCute),
    line("ガス使用設備", appointment.gasUsageEquipment),
    line("⭐️特殊条件", appointment.specialConditions),
    line("📍座標", appointment.coordinates),
    "",
    appointment.detail ? `詳細：\n${appointment.detail}` : null
  ].filter((p) => p !== null && p !== undefined);

  return parts.join("\n");
}

export function buildTelReminderMessage(appointment: Appointment) {
  const salesName = appointment.salesName || "";
  const telDate = formatInTimeZone(appointment.telAt, env.timezone, "M/d");
  const timeRange = telTimeRange(appointment.telAt, appointment.telAtEnd);
  return [
    "【翌日TEL】",
    `${formatMonthDayTime(appointment.visitAt)} 訪問予定`,
    `${telDate} ${timeRange}`,
    `${salesName}アポ ${withHonorific(appointment.nameKana)} TELの時間だよ！`,
    formatPhoneNumber(appointment.phoneNumber)
  ].join("\n");
}

export function buildPrevDayTelReminderMessage(appointment: Appointment) {
  const salesName = appointment.salesName || "";
  const telDate = formatInTimeZone(appointment.prevDayTelAt!, env.timezone, "M/d");
  const timeRange = telTimeRange(appointment.prevDayTelAt, appointment.prevDayTelAtEnd);
  return [
    "【前日TEL】",
    `${formatMonthDayTime(appointment.visitAt)} 訪問予定`,
    `${telDate} ${timeRange}`,
    `${salesName}アポ ${withHonorific(appointment.nameKana)} TELの時間だよ！`,
    formatPhoneNumber(appointment.phoneNumber)
  ].join("\n");
}

export function notificationLabel(type: NotificationLog["type"]) {
  if (type === "form_submitted") return "Form送信直後";
  if (type === "tel_reminder") return "TELリマインド";
  if (type === "prev_day_tel_reminder") return "前日TELリマインド";
  return type;
}
