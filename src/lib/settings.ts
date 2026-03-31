import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export async function getAppSettings() {
  try {
    const setting = await prisma.appSetting.findFirst({
      orderBy: { createdAt: "asc" }
    });

    return {
      id: setting?.id ?? null,
      lineGroupId: setting?.lineGroupId || env.lineGroupId,
      telReminderLineGroupId: setting?.telReminderLineGroupId || env.telReminderLineGroupId,
      timezone: setting?.timezone || env.timezone,
      lineMockMode: env.lineMockMode
    };
  } catch (error) {
    console.error("[SETTINGS] failed to load app settings, falling back to env", error);
    return {
      id: null,
      lineGroupId: env.lineGroupId,
      telReminderLineGroupId: env.telReminderLineGroupId,
      timezone: env.timezone,
      lineMockMode: env.lineMockMode
    };
  }
}

export async function upsertAppSettings(input: { lineGroupId: string; telReminderLineGroupId?: string }) {
  const existing = await prisma.appSetting.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (existing) {
    return prisma.appSetting.update({
      where: { id: existing.id },
      data: {
        lineGroupId: input.lineGroupId,
        telReminderLineGroupId: input.telReminderLineGroupId ?? existing.telReminderLineGroupId,
        timezone: env.timezone
      }
    });
  }

  return prisma.appSetting.create({
    data: {
      lineGroupId: input.lineGroupId,
      telReminderLineGroupId: input.telReminderLineGroupId ?? "",
      timezone: env.timezone
    }
  });
}
