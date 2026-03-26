import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resendNotification } from "@/lib/notifications";

const resendSchema = z.object({
  appointmentId: z.string().min(1),
  type: z.enum(["form_submitted", "tel_reminder"])
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = resendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "再送リクエストが不正です" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: parsed.data.appointmentId,
      deletedAt: null
    }
  });

  if (!appointment) {
    return NextResponse.json({ message: "対象アポイントが見つかりません" }, { status: 404 });
  }

  const result = await resendNotification(appointment, parsed.data.type);
  return NextResponse.json(result, {
    status: result.sent ? 200 : 500
  });
}
