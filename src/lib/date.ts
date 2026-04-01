import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { isValid } from "date-fns";
import { env } from "@/lib/env";

const DATE_TIME_PATTERN = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\s([01]?\d|2[0-3]):([0-5]\d)$/;

export function parseMonthDayTime(input: string, now = new Date(), timezone = env.timezone) {
  const trimmed = input.trim();
  const matched = trimmed.match(DATE_TIME_PATTERN);

  if (!matched) {
    return null;
  }

  const [, month, day, hour, minute] = matched;
  const year = Number(formatInTimeZone(now, timezone, "yyyy"));
  const isoLike = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:00`;
  const zoned = fromZonedTime(isoLike, timezone);

  if (!isValid(zoned)) {
    return null;
  }

  const parsedMonth = Number(formatInTimeZone(zoned, timezone, "M"));
  const parsedDay = Number(formatInTimeZone(zoned, timezone, "d"));

  if (parsedMonth !== Number(month) || parsedDay !== Number(day)) {
    return null;
  }

  return zoned;
}

export function formatMonthDayTime(value: Date | string, timezone = env.timezone) {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatInTimeZone(date, timezone, "M/d HH:mm");
}

export function toFormDateTime(value: Date | string, timezone = env.timezone) {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatInTimeZone(date, timezone, "MM/dd HH:mm");
}

export function toFormDate(value: Date | string, timezone = env.timezone) {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}

export function toFormTime(value: Date | string, timezone = env.timezone) {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatInTimeZone(date, timezone, "HH:mm");
}

export function parseDateTimeInput(dateStr: string, timeStr: string, timezone = env.timezone) {
  if (!dateStr || !timeStr) return null;
  const isoLike = `${dateStr}T${timeStr}:00`;
  const zoned = fromZonedTime(isoLike, timezone);
  if (!isValid(zoned)) return null;
  return zoned;
}

export function formatCreatedAt(value: Date | string, timezone = env.timezone) {
  const date = typeof value === "string" ? new Date(value) : value;
  return formatInTimeZone(date, timezone, "yyyy/MM/dd HH:mm");
}

export function zonedNow(timezone = env.timezone) {
  return toZonedTime(new Date(), timezone);
}

export function parseLocalDateBoundary(input: string, endOfDay = false, timezone = env.timezone) {
  const suffix = endOfDay ? "23:59:59" : "00:00:00";
  return fromZonedTime(`${input}T${suffix}`, timezone);
}
