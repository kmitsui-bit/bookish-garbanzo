import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseLocalDateBoundary } from "@/lib/date";

export type AppointmentListParams = {
  q?: string;
  sort?: string;
  direction?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
  telTarget?: "all" | "target" | "excluded";
  selfCall?: "all" | "true" | "false";
};

const sortableFields: Record<string, Prisma.AppointmentOrderByWithRelationInput> = {
  createdAt: { createdAt: "desc" },
  visitAt: { visitAt: "asc" },
  telAt: { telAt: "asc" },
  updatedAt: { updatedAt: "desc" },
  nameKana: { nameKana: "asc" },
  age: { age: "asc" }
};

export async function getAppointments(params: AppointmentListParams) {
  const q = params.q?.trim();
  const andConditions: Prisma.AppointmentWhereInput[] = [{ deletedAt: null }];

  if (q) {
    andConditions.push({
      OR: [
        { nameKana: { contains: q } },
        { phoneNumber: { contains: q } },
        { detail: { contains: q } },
        { specialConditions: { contains: q } }
      ]
    });
  }

  if (params.startDate || params.endDate) {
    const visitAt: Prisma.DateTimeFilter = {};
    if (params.startDate) {
      visitAt.gte = parseLocalDateBoundary(params.startDate);
    }
    if (params.endDate) {
      visitAt.lte = parseLocalDateBoundary(params.endDate, true);
    }
    andConditions.push({ visitAt });
  }

  if (params.telTarget === "target") {
    andConditions.push({ selfCall: false, telReminderEnabled: true });
  }

  if (params.telTarget === "excluded") {
    andConditions.push({
      OR: [{ selfCall: true }, { telReminderEnabled: false }]
    });
  }

  if (params.selfCall === "true") {
    andConditions.push({ selfCall: true });
  }

  if (params.selfCall === "false") {
    andConditions.push({ selfCall: false });
  }

  const orderBy =
    params.sort && sortableFields[params.sort]
      ? { [params.sort]: params.direction === "desc" ? "desc" : "asc" }
      : sortableFields.createdAt;

  return prisma.appointment.findMany({
    where: { AND: andConditions },
    orderBy,
    include: {
      notificationLogs: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });
}

export async function getAppointmentById(id: string) {
  return prisma.appointment.findFirst({
    where: { id, deletedAt: null },
    include: {
      notificationLogs: {
        orderBy: { createdAt: "desc" }
      }
    }
  });
}
