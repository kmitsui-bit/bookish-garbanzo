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

export type StaffNamesResult = {
  /** 取得できた営業マン名（プルダウンの選択肢） */
  names: string[];
  /** 取得に失敗した場合の理由（成功時は null） */
  error: string | null;
};

function authHeaders() {
  return { "Authorization": `Bearer ${env.btLogIntegrationToken}` };
}

/** 自動判別した orgId のキャッシュ（プロセス内） */
let discoveredOrgId: string | null = null;

/**
 * BT.log の orgId を自動判別する。
 *
 * スタッフ一覧API は組織スコープ必須（orgId 未指定だと 400）だが、
 * staff-revenue API は orgId が任意で、かつ応答に orgId を含む。
 * これを使って「エネルギー事業部のスタッフが所属する組織」を特定する。
 */
async function discoverOrgId(): Promise<string | null> {
  if (discoveredOrgId) return discoveredOrgId;

  try {
    const res = await fetch(`${env.btLogApiUrl}/api/integrations/staff-revenue?status=active`, {
      headers: authHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(STAFF_TIMEOUT_MS)
    });

    if (!res.ok) {
      console.error(`[bt-log-sync] discoverOrgId failed: staff-revenue が ${res.status} を返しました`);
      return null;
    }

    const data = await res.json() as { staff?: { orgId?: string; department?: string | null }[] };
    const rows = data.staff ?? [];

    // 複数組織が返る場合に備え、エネルギー事業部の在籍者が最も多い組織を採用する
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (!row.orgId || row.department !== "energy") continue;
      counts.set(row.orgId, (counts.get(row.orgId) ?? 0) + 1);
    }

    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!best) {
      console.error("[bt-log-sync] discoverOrgId failed: エネルギー事業部のスタッフが見つかりませんでした");
      return null;
    }

    discoveredOrgId = best[0];
    console.info(`[bt-log-sync] orgId を自動判別しました: ${discoveredOrgId}（energy ${best[1]}名）`);
    return discoveredOrgId;
  } catch (err) {
    console.error("[bt-log-sync] discoverOrgId error:", err);
    return null;
  }
}

/** 指定 orgId でスタッフ一覧を引く。失敗理由も返す */
async function fetchStaffNamesForOrg(orgId: string): Promise<StaffNamesResult> {
  const url =
    `${env.btLogApiUrl}/api/integrations/staff` +
    `?status=active&orgId=${encodeURIComponent(orgId)}`;

  const res = await fetch(url, {
    headers: authHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(STAFF_TIMEOUT_MS)
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const reason = `スタッフ一覧APIが ${res.status} を返しました`;
    console.error(`[bt-log-sync] fetchStaffNames failed: ${reason} ${body.slice(0, 200)}`);
    return { names: [], error: reason };
  }

  const data = await res.json() as { staff?: { displayName: string; isApoEnabled: boolean; department?: string | null }[] };
  const names = (data.staff ?? [])
    .filter((s) => s.department !== undefined ? s.department === 'energy' : s.isApoEnabled)
    .map((s) => s.displayName)
    .filter(Boolean);

  if (names.length === 0) {
    return { names: [], error: "エネルギー事業部の有効なスタッフが 0 件でした" };
  }

  return { names, error: null };
}

export async function fetchStaffNames(): Promise<StaffNamesResult> {
  if (!env.btLogApiUrl || !env.btLogIntegrationToken) {
    const reason = "BT_LOG_API_URL または BT_LOG_INTEGRATION_TOKEN が未設定です";
    console.error(`[bt-log-sync] fetchStaffNames skipped: ${reason}`);
    return { names: [], error: reason };
  }

  try {
    // BT_LOG_ORG_ID が設定されていれば優先。空振りしたら自動判別へフォールバックする
    // （誤った UUID が設定されていても動くようにするため）
    if (env.btLogOrgId) {
      const result = await fetchStaffNamesForOrg(env.btLogOrgId);
      if (result.names.length > 0) return result;
      console.error(
        `[bt-log-sync] BT_LOG_ORG_ID (${env.btLogOrgId}) では取得できませんでした（${result.error}）。自動判別に切り替えます`
      );
    }

    const orgId = await discoverOrgId();
    if (!orgId) {
      return { names: [], error: "BT.log の組織を特定できませんでした" };
    }

    return await fetchStaffNamesForOrg(orgId);
  } catch (err) {
    const reason = "スタッフ一覧APIに接続できません";
    console.error(`[bt-log-sync] fetchStaffNames error: ${reason}`, err);
    return { names: [], error: reason };
  }
}
