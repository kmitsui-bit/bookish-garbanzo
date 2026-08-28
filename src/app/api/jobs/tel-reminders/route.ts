import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendTelReminderNotification, sendPrevDayTelReminderNotification } from "@/lib/notifications";
import { getTelReminderWindow, isPrevDayTelDefaultTime } from "@/lib/tel-reminder";

function isAuthorized(request: Request) {
  if (!env.cronSecret) {
    return false;
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

  const prevDayAppointments = await prisma.appointment.findMany({
    where: {
      deletedAt: null,
      prevDayTelReminderSentAt: null,
      prevDayTelAt: {
        gte: targetStart,
        lte: targetEnd
      }
    }
  });

  // 「前日 かつ 18:00-20:00」のデフォルト設定のままのアポのみ前日TEL通知をスキップ
  // （前日以外の日付が指定されている場合は 18:00 開始でも通知する）
  const prevDayTargets = prevDayAppointments.filter(
    (a) => !isPrevDayTelDefaultTime(a.prevDayTelAt!, a.prevDayTelAtEnd, a.visitAt)
  );

  const [telResults, prevDayResults] = await Promise.all([
    Promise.all(appointments.map((a) => sendTelReminderNotification(a))),
    Promise.all(prevDayTargets.map((a) => sendPrevDayTelReminderNotification(a)))
  ]);

  return NextResponse.json({
    scannedAt: now,
    windowStart: targetStart,
    windowEnd: targetEnd,
    telMatchedCount: appointments.length,
    telResults,
    prevDayTelMatchedCount: prevDayTargets.length,
    prevDayTelResults: prevDayResults
  });
}
