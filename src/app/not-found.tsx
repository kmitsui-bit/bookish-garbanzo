import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <section className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">404</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">対象のデータが見つかりません</h2>
        <p className="mt-3 text-sm text-slate-600">削除済み、もしくはURLが正しくない可能性があります。</p>
        <Link
          href="/appointments"
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          一覧へ戻る
        </Link>
      </section>
    </AppShell>
  );
}
