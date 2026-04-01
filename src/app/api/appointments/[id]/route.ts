import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseAppointmentPayload } from "@/lib/validation";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const appointment = await prisma.appointment.findFirst({
    where: { id, deletedAt: null },
    include: { notificationLogs: { orderBy: { createdAt: "desc" } } }
  });

  if (!appointment) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ appointment });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
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

  const existing = await prisma.appointment.findFirst({
    where: { id, deletedAt: null }
  });

  if (!existing) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const telChanged = existing.telAt.getTime() !== parsed.data.telAt.getTime();
  const selfCallChanged = existing.selfCall !== parsed.data.selfCall;
  const telAppointmentChanged = existing.telAppointment !== parsed.data.telAppointment;

  const appointment = await prisma.appointment.update({
    where: { id },
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
      appointmentTypeOther: parsed.data.appointmentTypeOther,
      salesName: parsed.data.salesName,
      genderDetail: parsed.data.genderDetail,
      selfCall: parsed.data.selfCall,
      telAppointment: parsed.data.telAppointment,
      telReminderEnabled: parsed.data.telReminderEnabled,
      telReminderSentAt: telChanged || selfCallChanged || telAppointmentChanged ? null : existing.telReminderSentAt
    }
  });

  return NextResponse.json({ appointment });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.appointment.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  return NextResponse.json({ success: true });
}
