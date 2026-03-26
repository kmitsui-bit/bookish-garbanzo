import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendTelReminderNotification } from "@/lib/notifications";
import { getTelReminderWindow } from "@/lib/tel-reminder";

function isAuthorized(request: Request) {
  if (!env.cronSecret) {
    return true;
  }

  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${env.cronSecret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const { targetStart, targetEnd } = getTelReminderWindow(now);

  const appointments = await prisma.appointment.findMany({
    where: {
      deletedAt: null,
      selfCall: false,
      telReminderEnabled: true,
      telReminderSentAt: null,
      telAt: {
        gte: targetStart,
        lte: targetEnd
      }
    }
  });

  const results = await Promise.all(appointments.map((appointment) => sendTelReminderNotification(appointment)));

  return NextResponse.json({
    scannedAt: now,
    windowStart: targetStart,
    windowEnd: targetEnd,
    matchedCount: appointments.length,
    results
  });
}
