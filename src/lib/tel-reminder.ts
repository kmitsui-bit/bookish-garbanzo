import type { Appointment } from "@prisma/client";
import { addMinutes, endOfMinute, startOfMinute } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { getDateMinusOne } from "@/lib/date";
import { env } from "@/lib/env";

export function getTelReminderWindow(now = new Date()) {
  return {
    targetStart: startOfMinute(addMinutes(now, 4)),
    targetEnd: endOfMinute(addMinutes(now, 5))
  };
}

/**
 * 「訪問日の前日 かつ 18:00-20:00」というデフォルト設定のままかどうか判定。
 * 前日以外の日付が指定されている場合は、意図的な設定とみなして 18:00-20:00 でも false を返す。
 */
export function isPrevDayTelDefaultTime(
  start: Date,
  end: Date | null | undefined,
  visitAt?: Date | null,
  timezone = env.timezone
): boolean {
  const startTime = formatInTimeZone(start, timezone, "HH:mm");
  const endTime = end ? formatInTimeZone(end, timezone, "HH:mm") : null;
  if (startTime !== "18:00" || endTime !== "20:00") return false;
  if (!visitAt) return true;
  return formatInTimeZone(start, timezone, "yyyy-MM-dd") === getDateMinusOne(visitAt, timezone);
}

export function isTelReminderEligible(
  appointment: Pick<Appointment, "selfCall" | "telReminderEnabled" | "telReminderSentAt" | "deletedAt" | "telAt">,
  now = new Date()
) {
  if (appointment.deletedAt) return false;
  if (appointment.selfCall) return false;
  if (!appointment.telReminderEnabled) return false;
  if (appointment.telReminderSentAt) return false;

  const { targetStart, targetEnd } = getTelReminderWindow(now);
  const telAt = appointment.telAt.getTime();

  return telAt >= targetStart.getTime() && telAt <= targetEnd.getTime();
}
