import type { Appointment } from "@prisma/client";
import { addMinutes, endOfMinute, startOfMinute } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { env } from "@/lib/env";

export function getTelReminderWindow(now = new Date()) {
  return {
    targetStart: startOfMinute(addMinutes(now, 4)),
    targetEnd: endOfMinute(addMinutes(now, 5))
  };
}

/** 18:00-20:00（デフォルト設定）かどうか判定 */
export function isPrevDayTelDefaultTime(
  start: Date,
  end: Date | null | undefined,
  timezone = env.timezone
): boolean {
  const startTime = formatInTimeZone(start, timezone, "HH:mm");
  const endTime = end ? formatInTimeZone(end, timezone, "HH:mm") : null;
  return startTime === "18:00" && endTime === "20:00";
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
