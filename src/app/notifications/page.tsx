import { AppShell } from "@/components/app-shell";
import { BulkResendFailedButton } from "@/components/bulk-resend-failed-button";
import { NotificationLogList } from "@/components/notification-log-list";
import Link from "next/link";
import { getNotificationLogs } from "@/lib/notification-queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const type = typeof params.type === "string" ? params.type : "all";
  const status = typeof params.status === "string" ? params.status : "all";
  const page = typeof params.page === "string" ? params.page : "1";
  const result = await getNotificationLogs({ q, type, status, page });
  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (type !== "all") baseParams.set("type", type);
  if (status !== "all") baseParams.set("status", status);

  const previousParams = new URLSearchParams(baseParams);
  previousParams.set("page", String(Math.max(1, result.page - 1)));

  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(result.totalPages, result.page + 1)));

  return (
    <AppShell currentPath="/notifications">
      <section className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Logs</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">通知ログ確認</h2>
          <p className="mt-2 text-sm text-slate-600">Form送信直後通知とTELリマインド通知の結果を確認できます。</p>
        </div>
        <form className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="名前 / 電話番号 / 宛先 / 文面で検索"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 md:col-span-2"
          />
          <select
            name="type"
            defaultValue={type}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          >
            <option value="all">種別: すべて</option>
            <option value="form_submitted">Form送信直後</option>
            <option value="tel_reminder">TELリマインド</option>
          </select>
          <select
            name="status"
            defaultValue={status}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          >
            <option value="all">状態: すべて</option>
            <option value="success">成功</option>
            <option value="failed">失敗</option>
          </select>
          <button className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white">絞り込む</button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            {result.total} 件中 {Math.min((result.page - 1) * 20 + 1, result.total)} - {Math.min(result.page * 20, result.total)} 件を表示
          </p>
          <BulkResendFailedButton q={q} type={type} status={status} />
        </div>
        <NotificationLogList logs={result.logs} />
        <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            ページ {result.page} / {result.totalPages}
          </p>
          <div className="flex gap-3">
            <Link
              href={`/notifications?${previousParams.toString()}`}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${result.page <= 1 ? "pointer-events-none bg-slate-100 text-slate-400" : "bg-white text-slate-700 border border-slate-200"}`}
            >
              前へ
            </Link>
            <Link
              href={`/notifications?${nextParams.toString()}`}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${result.page >= result.totalPages ? "pointer-events-none bg-slate-100 text-slate-400" : "bg-slate-900 text-white"}`}
            >
              次へ
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
