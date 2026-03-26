import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DeleteAppointmentButton } from "@/components/delete-appointment-button";
import { RetryNotificationButton } from "@/components/retry-notification-button";
import { StatusBadge } from "@/components/status-badge";
import { getAppointmentById } from "@/lib/appointment-queries";
import { formatCreatedAt, formatMonthDayTime } from "@/lib/date";
import { notificationLabel, withHonorific } from "@/lib/formatters";

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await getAppointmentById(id);

  if (!appointment) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Detail</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">{withHonorific(appointment.nameKana)}</h2>
              <p className="mt-2 text-sm text-slate-600">
                作成日時: {formatCreatedAt(appointment.createdAt)} / 更新日時: {formatCreatedAt(appointment.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/appointments/${appointment.id}/edit`} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                編集
              </Link>
              <DeleteAppointmentButton id={appointment.id} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">アポイント情報</h3>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["訪問日時", formatMonthDayTime(appointment.visitAt)],
                ["☎TEL日時", formatMonthDayTime(appointment.telAt)],
                ["年齢", String(appointment.age)],
                ["性別", appointment.gender],
                ["電話番号", appointment.phoneNumber],
                ["電気代", appointment.electricityCost || "-"],
                ["売電", appointment.sellPower || "-"],
                ["パネル年数", appointment.panelYears || "-"],
                ["ガスorエコキュート", appointment.gasOrEcoCute || "-"],
                ["⭐️特殊条件", appointment.specialConditions || "-"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="mt-1 font-medium text-slate-900">{value}</dd>
                </div>
              ))}
              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <dt className="text-sm text-slate-500">詳細</dt>
                <dd className="mt-1 whitespace-pre-wrap font-medium text-slate-900">{appointment.detail || "-"}</dd>
              </div>
            </dl>
          </article>

          <aside className="space-y-6">
            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">通知状態</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge tone={appointment.formNotificationSentAt ? "success" : "warning"}>
                  Form通知 {appointment.formNotificationSentAt ? "送信済み" : "未送信"}
                </StatusBadge>
                <StatusBadge tone={!appointment.selfCall && appointment.telReminderEnabled ? "success" : "default"}>
                  {!appointment.selfCall && appointment.telReminderEnabled ? "TEL通知対象" : "TEL通知対象外"}
                </StatusBadge>
                <StatusBadge tone={appointment.selfCall ? "warning" : "default"}>
                  自分でTEL {appointment.selfCall ? "ON" : "OFF"}
                </StatusBadge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <RetryNotificationButton appointmentId={appointment.id} type="form_submitted" />
                <RetryNotificationButton appointmentId={appointment.id} type="tel_reminder" />
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">LINE送信履歴</h3>
              <div className="mt-4 space-y-4">
                {appointment.notificationLogs.length === 0 ? (
                  <p className="text-sm text-slate-500">通知履歴はまだありません。</p>
                ) : (
                  appointment.notificationLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{notificationLabel(log.type)}</p>
                        <StatusBadge tone={log.status === "success" ? "success" : "danger"}>{log.status}</StatusBadge>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {log.sentAt ? formatCreatedAt(log.sentAt) : formatCreatedAt(log.createdAt)}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{log.payload}</p>
                      {log.errorMessage ? <p className="mt-2 text-sm text-rose-600">{log.errorMessage}</p> : null}
                    </div>
                  ))
                )}
              </div>
            </article>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
