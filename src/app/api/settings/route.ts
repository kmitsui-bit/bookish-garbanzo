import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSettings, upsertAppSettings } from "@/lib/settings";

const settingsSchema = z.object({
  lineGroupId: z.string().min(1, "LINEグループIDは必須です")
});

export async function GET() {
  const settings = await getAppSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.flatten().formErrors[0] ?? "設定値を確認してください"
      },
      { status: 400 }
    );
  }

  const settings = await upsertAppSettings(parsed.data);
  return NextResponse.json({ settings });
}
