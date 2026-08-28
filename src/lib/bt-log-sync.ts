import { env } from "@/lib/env";
import { formatInTimeZone } from "date-fns-tz";

/** 1回の送信に許す時間。Netlify の関数タイムアウト(既定10秒)に収まるよう短くする。 */
const ATTEMPT_TIMEOUT_MS = 3000;
/** リトライを含めた合計予算。これを超える見込みなら再送せず諦める。 */
const TOTAL_BUDGET_MS = 8000;
/** リトライ前の待機時間。要素数 = 最大リトライ回数。 */
const RETRY_BACKOFF_MS = [400, 1200];

const STAFF_TIMEOUT_MS = 5000;

export type ApoSyncResult =
  | { ok: true; skipped: boolean }
  | { ok: false; reason: string; attempts: number };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 再送して良い失敗か。4xx はリクエスト自体が不正なので再送しても無駄。 */
function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429 || status === 408;
}

async function callApoSync(params: {
  idempotencyKey: string;
  staffName: string;
  activityDate: Date;
  telAppointment: boolean;
  gender: string;
  scheduledVisit?: boolean;
  undo?: boolean;
}): Promise<ApoSyncResult> {
  if (!env.btLogApiUrl || !env.btLogIntegrationToken) return { ok: true, skipped: true };

  const activityDate = formatInTimeZone(params.activityDate, env.timezone, "yyyy-MM-dd");
  const body = JSON.stringify({
    idempotencyKey: params.idempotencyKey,
    staffName: params.staffName,
    activityDate,
    telAppointment: params.telAppointment,
    gender: params.gender,
    scheduledVisit: params.scheduledVisit ?? false,
    undo: params.undo ?? false
  });

  const startedAt = Date.now();
  let attempts = 0;
  let lastReason = "unknown";

  for (let i = 0; i <= RETRY_BACKOFF_MS.length; i++) {
    if (i > 0) {
      const wait = RETRY_BACKOFF_MS[i - 1];
      // 予算内に次の試行が収まらないなら、待つだけ無駄なので打ち切る
      if (Date.now() - startedAt + wait + ATTEMPT_TIMEOUT_MS > TOTAL_BUDGET_MS) break;
      await sleep(wait);
    }

    attempts++;
    try {
      const res = await fetch(`${env.btLogApiUrl}/api/integrations/apo-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.btLogIntegrationToken}`,
          "Idempotency-Key": params.idempotencyKey
        },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)
      });

      if (res.ok) return { ok: true, skipped: false };

      const text = await res.text().catch(() => "");
      lastReason = `HTTP ${res.status} ${text.slice(0, 200)}`;
      console.error(`[bt-log-sync] apo-sync ${res.status} (attempt ${attempts}):`, text);
      if (!isRetryableStatus(res.status)) break;
    } catch (err) {
      lastReason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      console.error(`[bt-log-sync] apo-sync failed (attempt ${attempts}):`, err);
    }
  }

  console.error(
    `[bt-log-sync] apo-sync giving up after ${attempts} attempt(s) [${params.idempotencyKey}]: ${lastReason}`
  );
  return { ok: false, reason: lastReason, attempts };
}

export function syncApoToActivityLog(params: {
  appointmentId: string;
  staffName: string;
  activityDate: Date;
  telAppointment: boolean;
  gender: string;
  scheduledVisit?: boolean;
}): Promise<ApoSyncResult> {
  const { appointmentId, ...rest } = params;
  return callApoSync({ ...rest, idempotencyKey: `apo:${appointmentId}` });
}

export function undoApoSync(params: {
  appointmentId: string;
  staffName: string;
  activityDate: Date;
  telAppointment: boolean;
  gender: string;
  scheduledVisit?: boolean;
}): Promise<ApoSyncResult> {
  const { appointmentId, ...rest } = params;
  return callApoSync({ ...rest, undo: true, idempotencyKey: `apo:${appointmentId}:undo` });
}

export async function fetchStaffNames(): Promise<string[]> {
  if (!env.btLogApiUrl || !env.btLogIntegrationToken) return [];

  try {
    const res = await fetch(`${env.btLogApiUrl}/api/integrations/staff?status=active`, {
      headers: { "Authorization": `Bearer ${env.btLogIntegrationToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(STAFF_TIMEOUT_MS)
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
