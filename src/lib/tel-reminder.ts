import type { Appointment } from "@prisma/client";
import { addMinutes, endOfMinute, startOfMinute } from "date-fns";

export function getTelReminderWindow(now = new Date()) {
  return {
    targetStart: startOfMinute(addMinutes(now, 4)),
    targetEnd: endOfMinute(addMinutes(now, 5))
  };
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
