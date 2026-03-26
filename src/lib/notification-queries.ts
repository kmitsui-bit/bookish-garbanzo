import type { NotificationLog } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildNotificationLogWhereInput } from "@/lib/notification-filters";

export const NOTIFICATION_LOGS_PER_PAGE = 20;

export function normalizePage(input?: string | null) {
  const page = Number(input);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  return Math.floor(page);
}

export async function getNotificationLogs(params: {
  q?: string;
  type?: string;
  status?: string;
  page?: string | null;
}) {
  const where = buildNotificationLogWhereInput(params);
  const page = normalizePage(params.page);
  const skip = (page - 1) * NOTIFICATION_LOGS_PER_PAGE;

  const [total, logs] = await Promise.all([
    prisma.notificationLog.count({ where }),
    prisma.notificationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        appointment: {
          select: {
            id: true,
            nameKana: true,
            phoneNumber: true
          }
        }
      },
      skip,
      take: NOTIFICATION_LOGS_PER_PAGE
    })
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / NOTIFICATION_LOGS_PER_PAGE))
  };
}

export function pickLatestFailedRetries<T extends Pick<NotificationLog, "id" | "appointmentId" | "type" | "status" | "createdAt">>(logs: T[]) {
  const latestMap = new Map<string, T>();

  for (const log of logs) {
    if (log.status !== "failed") continue;
    const key = `${log.appointmentId}:${log.type}`;
    const existing = latestMap.get(key);
    if (!existing || log.createdAt > existing.createdAt) {
      latestMap.set(key, log);
    }
  }

  return [...latestMap.values()];
}
