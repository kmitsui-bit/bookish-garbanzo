import { env } from "@/lib/env";
import { formatInTimeZone } from "date-fns-tz";

async function callApoSync(params: {
  staffName: string;
  activityDate: Date;
  telAppointment: boolean;
  gender: string;
  scheduledVisit?: boolean;
  undo?: boolean;
}): Promise<void> {
  if (!env.btLogApiUrl || !env.btLogIntegrationToken) return;

  const activityDate = formatInTimeZone(params.activityDate, env.timezone, "yyyy-MM-dd");

  try {
    const res = await fetch(`${env.btLogApiUrl}/api/integrations/apo-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.btLogIntegrationToken}`
      },
      body: JSON.stringify({
        staffName: params.staffName,
        activityDate,
        telAppointment: params.telAppointment,
        gender: params.gender,
        scheduledVisit: params.scheduledVisit ?? false,
        undo: params.undo ?? false
      })
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[bt-log-sync] apo-sync ${res.status}:`, text);
    }
  } catch (err) {
    console.error("[bt-log-sync] apo-sync failed:", err);
  }
}

export function syncApoToActivityLog(params: {
  staffName: string;
  activityDate: Date;
  telAppointment: boolean;
  gender: string;
  scheduledVisit?: boolean;
}): Promise<void> {
  return callApoSync(params);
}

export function undoApoSync(params: {
  staffName: string;
  activityDate: Date;
  telAppointment: boolean;
  gender: string;
  scheduledVisit?: boolean;
}): Promise<void> {
  return callApoSync({ ...params, undo: true });
}

export async function fetchStaffNames(): Promise<string[]> {
  if (!env.btLogApiUrl || !env.btLogIntegrationToken) return [];

  try {
    const res = await fetch(`${env.btLogApiUrl}/api/integrations/staff?status=active`, {
      headers: { "Authorization": `Bearer ${env.btLogIntegrationToken}` },
      cache: "no-store"
    });

    if (!res.ok) return [];

    const data = await res.json() as { staff?: { displayName: string; isApoEnabled: boolean; department?: string | null }[] };
    return (data.staff ?? [])
      .filter((s) => s.department !== undefined ? s.department === 'energy' : s.isApoEnabled)
      .map((s) => s.displayName)
      .filter(Boolean);
  } catch {
    return [];
  }
}
