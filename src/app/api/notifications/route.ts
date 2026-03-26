import { NextResponse } from "next/server";
import { getNotificationLogs } from "@/lib/notification-queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await getNotificationLogs({
    q: searchParams.get("q") ?? "",
    type: searchParams.get("type") ?? "all",
    status: searchParams.get("status") ?? "all",
    page: searchParams.get("page")
  });

  return NextResponse.json(result);
}
