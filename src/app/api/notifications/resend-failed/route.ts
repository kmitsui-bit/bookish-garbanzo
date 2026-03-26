import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resendNotification } from "@/lib/notifications";
import { buildNotificationLogWhereInput } from "@/lib/notification-filters";
import { pickLatestFailedRetries } from "@/lib/notification-queries";

const bulkSchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bulkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "一括再送リクエストが不正です" }, { status: 400 });
  }

  const where = buildNotificationLogWhereInput({
    q: parsed.data.q ?? "",
    type: parsed.data.type ?? "all",
    status: "failed"
  });

  const failedLogs = await prisma.notificationLog.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  const retryTargets = pickLatestFailedRetries(failedLogs);

  const results = await Promise.all(
    retryTargets.map(async (log) => {
      if (log.type !== "form_submitted" && log.type !== "tel_reminder") {
        return { sent: false, error: "Unsupported notification type" };
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: log.appointmentId,
          deletedAt: null
        }
      });

      if (!appointment) {
        return { sent: false, error: "Appointment not found" };
      }

      return resendNotification(appointment, log.type);
    })
  );

  const successCount = results.filter((result) => result.sent).length;
  const failedCount = results.length - successCount;

  return NextResponse.json({
    targetCount: retryTargets.length,
    successCount,
    failedCount
  });
}
