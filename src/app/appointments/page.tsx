import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AppointmentsTable } from "@/components/appointments-table";
import { getAppointments } from "@/lib/appointment-queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AppointmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const appointments = await getAppointments({
    q: typeof params.q === "string" ? params.q : "",
    sort: typeof params.sort === "string" ? params.sort : "createdAt",
    direction: params.direction === "asc" ? "asc" : "desc",
    startDate: typeof params.startDate === "string" ? params.startDate : "",
    endDate: typeof params.endDate === "string" ? params.endDate : "",
    telTarget: typeof params.telTarget === "string" ? (params.telTarget as "all" | "target" | "excluded") : "all",
    selfCall: typeof params.selfCall === "string" ? (params.selfCall as "all" | "true" | "false") : "all"
  });

  return (
    <AppShell currentPath="/appointments">
      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Overview</p>
            <h2 className="text-3xl font-semibold text-slate-900">アポイント一覧</h2>
            <p className="mt-2 text-sm text-slate-600">検索、絞り込み、並び替えでスプレッドシート感覚に近い運用ができます。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/api/appointments/export"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              CSV出力
            </a>
            <Link
              href="/appointments/new"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              新規登録
            </Link>
          </div>
        </div>

        <form className="grid gap-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
          <input
            name="q"
            defaultValue={typeof params.q === "string" ? params.q : ""}
            placeholder="名前 / 電話番号 / 詳細で検索"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          />
          <input
            name="startDate"
            type="date"
            defaultValue={typeof params.startDate === "string" ? params.startDate : ""}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          />
          <input
            name="endDate"
            type="date"
            defaultValue={typeof params.endDate === "string" ? params.endDate : ""}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          />
          <select
            name="telTarget"
            defaultValue={typeof params.telTarget === "string" ? params.telTarget : "all"}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          >
            <option value="all">TEL通知対象: すべて</option>
            <option value="target">TEL通知対象: 対象のみ</option>
            <option value="excluded">TEL通知対象: 対象外のみ</option>
          </select>
          <select
            name="selfCall"
            defaultValue={typeof params.selfCall === "string" ? params.selfCall : "all"}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          >
            <option value="all">自分でTEL: すべて</option>
            <option value="true">自分でTEL: ON</option>
            <option value="false">自分でTEL: OFF</option>
          </select>
          <select
            name="sort"
            defaultValue={typeof params.sort === "string" ? params.sort : "createdAt"}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          >
            <option value="createdAt">作成日時</option>
            <option value="visitAt">訪問日時</option>
            <option value="telAt">TEL日時</option>
            <option value="updatedAt">更新日時</option>
            <option value="nameKana">名前</option>
            <option value="age">年齢</option>
          </select>
          <select
            name="direction"
            defaultValue={typeof params.direction === "string" ? params.direction : "desc"}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 xl:col-span-1"
          >
            <option value="desc">降順</option>
            <option value="asc">昇順</option>
          </select>
          <button className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white xl:col-span-1">絞り込む</button>
        </form>

        <AppointmentsTable appointments={appointments} />
      </section>
    </AppShell>
  );
}
