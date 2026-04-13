import type { Appointment, NotificationLog } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { buildFormSubmittedMessage, buildTelReminderMessage, buildPrevDayTelReminderMessage } from "@/lib/formatters";
import { getAppSettings } from "@/lib/settings";

export type NotificationType = "form_submitted" | "tel_reminder" | "prev_day_tel_reminder";

async function pushLineMessage(text: string, lineGroupId: string) {
  if (env.lineMockMode) {
    console.info("[LINE MOCK]", { destination: lineGroupId, text });
    return { ok: true, mocked: true };
  }

  if (!env.lineChannelAccessToken) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is required when LINE_MOCK_MODE=false");
  }

  if (!lineGroupId) {
    throw new Error("LINE_GROUP_ID is required when LINE_MOCK_MODE=false");
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.lineChannelAccessToken}`
    },
    body: JSON.stringify({
      to: lineGroupId,
      messages: [{ type: "text", text }]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE push failed: ${response.status} ${body}`);
  }

  return { ok: true, mocked: false };
}

async function createNotificationLog(
  appointmentId: string,
  type: NotificationType,
  destinationId: string,
  payload: string,
  status: "success" | "failed",
  errorMessage?: string
) {
  return prisma.notificationLog.create({
    data: {
      appointmentId,
      type,
      destinationType: "line_group",
      destinationId,
      payload,
      status,
      errorMessage,
      sentAt: status === "success" ? new Date() : null
    }
  });
}

async function hasSuccessfulLog(appointmentId: string, type: NotificationType) {
  const log = await prisma.notificationLog.findFirst({
    where: {
      appointmentId,
      type,
      status: "success"
    }
  });

  return Boolean(log);
}

export async function sendFormSubmittedNotification(appointment: Appointment) {
  const settings = await getAppSettings();
  const payload = buildFormSubmittedMessage(appointment);

  try {
    if (await hasSuccessfulLog(appointment.id, "form_submitted")) {
      return { skipped: true };
    }

    await pushLineMessage(payload, settings.lineGroupId);
    await createNotificationLog(appointment.id, "form_submitted", settings.lineGroupId, payload, "success");
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { formNotificationSentAt: new Date() }
    });

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown LINE error";
    await createNotificationLog(appointment.id, "form_submitted", settings.lineGroupId, payload, "failed", message);
    console.error("Form notification failed", error);
    return { sent: false, error: message };
  }
}

export async function sendTelReminderNotification(appointment: Appointment) {
  const settings = await getAppSettings();
  if (appointment.selfCall || !appointment.telReminderEnabled || appointment.telReminderSentAt) {
    return { skipped: true };
  }

  const alreadySent = await hasSuccessfulLog(appointment.id, "tel_reminder");
  if (alreadySent) {
    return { skipped: true };
  }

  const payload = buildTelReminderMessage(appointment);
  const destinationId = settings.telReminderLineGroupId || settings.lineGroupId;

  try {
    await pushLineMessage(payload, destinationId);
    await createNotificationLog(appointment.id, "tel_reminder", destinationId, payload, "success");
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { telReminderSentAt: new Date() }
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown LINE error";
    await createNotificationLog(appointment.id, "tel_reminder", destinationId, payload, "failed", message);
    console.error("TEL reminder failed", error);
    return { sent: false, error: message };
  }
}

export async function sendPrevDayTelReminderNotification(appointment: Appointment) {
  const settings = await getAppSettings();
  if (!appointment.prevDayTelAt || appointment.prevDayTelReminderSentAt) {
    return { skipped: true };
  }

  const alreadySent = await hasSuccessfulLog(appointment.id, "prev_day_tel_reminder");
  if (alreadySent) {
    return { skipped: true };
  }

  const payload = buildPrevDayTelReminderMessage(appointment);
  const destinationId = settings.telReminderLineGroupId || settings.lineGroupId;

  try {
    await pushLineMessage(payload, destinationId);
    await createNotificationLog(appointment.id, "prev_day_tel_reminder", destinationId, payload, "success");
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { prevDayTelReminderSentAt: new Date() }
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown LINE error";
    await createNotificationLog(appointment.id, "prev_day_tel_reminder", destinationId, payload, "failed", message);
    console.error("Prev day TEL reminder failed", error);
    return { sent: false, error: message };
  }
}

export async function resendNotification(appointment: Appointment, type: NotificationType) {
  const settings = await getAppSettings();
  const payload = type === "form_submitted" ? buildFormSubmittedMessage(appointment) : buildTelReminderMessage(appointment);

  try {
    await pushLineMessage(payload, settings.lineGroupId);
    await createNotificationLog(appointment.id, type, settings.lineGroupId, payload, "success");
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: type === "form_submitted" ? { formNotificationSentAt: new Date() } : { telReminderSentAt: new Date() }
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown LINE error";
    await createNotificationLog(appointment.id, type, settings.lineGroupId, payload, "failed", message);
    return { sent: false, error: message };
  }
}

export type NotificationLogWithAppointment = NotificationLog & {
  appointment: Pick<Appointment, "id" | "nameKana" | "phoneNumber">;
};
