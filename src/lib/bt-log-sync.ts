import { env } from "@/lib/env";
import { formatInTimeZone } from "date-fns-tz";

export async function syncApoToActivityLog(params: {
  staffName: string;
  activityDate: Date;
  telAppointment: boolean;
  gender: string;
}): Promise<void> {
  if (!env.btLogApiUrl || !env.btLogIntegrationToken) return;

  const activityDate = formatInTimeZone(params.activityDate, env.timezone, "yyyy-MM-dd");

  try {
    await fetch(`${env.btLogApiUrl}/api/integrations/apo-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.btLogIntegrationToken}`
      },
      body: JSON.stringify({
        staffName: params.staffName,
        activityDate,
        telAppointment: params.telAppointment,
        gender: params.gender
      })
    });
  } catch (err) {
    console.error("[bt-log-sync] apo-sync failed:", err);
  }
}

export async function fetchStaffNames(): Promise<string[]> {
  if (!env.btLogApiUrl || !env.btLogIntegrationToken) return [];

  try {
    const res = await fetch(`${env.btLogApiUrl}/api/integrations/staff?status=active`, {
      headers: { "Authorization": `Bearer ${env.btLogIntegrationToken}` },
      next: { revalidate: 300 }
    });

    if (!res.ok) return [];

    const data = await res.json() as { staff?: { displayName: string }[] };
    return (data.staff ?? []).map((s) => s.displayName).filter(Boolean);
  } catch {
    return [];
  }
}
