import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppSettings, upsertAppSettings } from "@/lib/settings";

const settingsSchema = z.object({
  lineGroupId: z.string().min(1, "LINEグループIDは必須です"),
  telReminderLineGroupId: z.string().optional().default("")
});

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[API SETTINGS] failed to read settings", error);
    return NextResponse.json({ message: "設定の取得に失敗しました" }, { status: 500 });
  }
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

  try {
    const settings = await upsertAppSettings(parsed.data);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[API SETTINGS] failed to save settings", error);
    return NextResponse.json(
      {
        message: "設定の保存に失敗しました。Netlify ではローカル SQLite を保持できないため、環境変数での設定が必要な場合があります。"
      },
      { status: 500 }
    );
  }
}
