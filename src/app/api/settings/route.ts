import { NextResponse } from "next/server";
import { getAppSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[API SETTINGS] failed to read settings", error);
    return NextResponse.json({ message: "設定の取得に失敗しました" }, { status: 500 });
  }
}
