import type { Prisma } from "@prisma/client";

export function buildNotificationLogWhereInput(params: { q?: string; type?: string; status?: string }): Prisma.NotificationLogWhereInput {
  const q = params.q?.trim() ?? "";
  const type = params.type ?? "all";
  const status = params.status ?? "all";

  return {
    ...(type !== "all" ? { type } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { payload: { contains: q } },
            { destinationId: { contains: q } },
            { appointment: { nameKana: { contains: q } } },
            { appointment: { phoneNumber: { contains: q } } }
          ]
        }
      : {})
  };
}
