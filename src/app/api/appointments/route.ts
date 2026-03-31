import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseAppointmentPayload } from "@/lib/validation";
import { sendFormSubmittedNotification } from "@/lib/notifications";

export async function GET() {
  const appointments = await prisma.appointment.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = parseAppointmentPayload(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "入力内容を確認してください",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      visitAt: parsed.data.visitAt,
      telAt: parsed.data.telAt,
      age: parsed.data.age,
      gender: parsed.data.gender,
      nameKana: parsed.data.nameKana.trim(),
      phoneNumber: parsed.data.phoneNumber.trim(),
      electricityCostHigh: parsed.data.electricityCostHigh,
      electricityCostLow: parsed.data.electricityCostLow,
      sellPowerHigh: parsed.data.sellPowerHigh,
      sellPowerLow: parsed.data.sellPowerLow,
      gasCostHigh: parsed.data.gasCostHigh,
      gasCostLow: parsed.data.gasCostLow,
      gasUsageEquipment: parsed.data.gasUsageEquipment,
      panelYears: parsed.data.panelYears,
      gasOrEcoCute: parsed.data.gasOrEcoCute,
      specialConditions: parsed.data.specialConditions,
      detail: parsed.data.detail,
      appointmentType: parsed.data.appointmentType,
      selfCall: parsed.data.selfCall,
      telAppointment: parsed.data.telAppointment,
      telReminderEnabled: parsed.data.telReminderEnabled
    }
  });

  const notificationResult = await sendFormSubmittedNotification(appointment);

  return NextResponse.json({
    appointment,
    notificationResult
  });
}
