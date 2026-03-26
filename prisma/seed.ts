process.loadEnvFile?.(".env");

import { PrismaClient } from "@prisma/client";
import { addMinutes, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  await prisma.notificationLog.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.appSetting.deleteMany();

  const now = new Date();
  const sampleTel = addMinutes(now, 5);
  const sampleVisit = addMinutes(now, 180);

  const appointment = await prisma.appointment.create({
    data: {
      visitAt: sampleVisit,
      telAt: sampleTel,
      age: 30,
      gender: "A",
      nameKana: "ミウラ",
      phoneNumber: "08083759395",
      electricityCost: "6000~15000円",
      sellPower: "3000〜8000円",
      panelYears: "5年目",
      gasOrEcoCute: "エコキュート",
      specialConditions: "",
      detail: "非常に温厚な夫婦だった。",
      selfCall: false,
      telReminderEnabled: true
    }
  });

  await prisma.appointment.create({
    data: {
      visitAt: subDays(sampleVisit, 1),
      telAt: subDays(sampleTel, 1),
      age: 45,
      gender: "AB",
      nameKana: "タナカ",
      phoneNumber: "09012345678",
      electricityCost: "10000円前後",
      sellPower: "なし",
      panelYears: "未確認",
      gasOrEcoCute: "ガス",
      specialConditions: "日中連絡不可",
      detail: "夕方以降の連絡希望。",
      selfCall: true,
      telReminderEnabled: false,
      formNotificationSentAt: subDays(now, 1)
    }
  });

  await prisma.notificationLog.create({
    data: {
      appointmentId: appointment.id,
      type: "form_submitted",
      destinationType: "line_group",
      destinationId: "mock-line-group",
      payload: "seed notification",
      status: "success",
      sentAt: now
    }
  });

  await prisma.appSetting.create({
    data: {
      lineGroupId: "mock-line-group",
      timezone: "Asia/Tokyo"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
