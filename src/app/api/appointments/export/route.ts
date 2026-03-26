import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appointmentsToCsv } from "@/lib/csv";

export async function GET() {
  const appointments = await prisma.appointment.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  const csv = appointmentsToCsv(appointments);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="appointments.csv"'
    }
  });
}
