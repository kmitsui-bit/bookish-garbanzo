import type { NotificationLogWithAppointment } from "@/lib/notifications";
import { formatCreatedAt } from "@/lib/date";
import { notificationLabel, withHonorific } from "@/lib/formatters";
import { RetryNotificationButton } from "@/components/retry-notification-button";
import { StatusBadge } from "@/components/status-badge";

function isRetryableType(type: string): type is "form_submitted" | "tel_reminder" {
  return type === "form_submitted" || type === "tel_reminder";
}

export function NotificationLogList({ logs }: { logs: NotificationLogWithAppointment[] }) {
  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <article key={log.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{notificationLabel(log.type)}</p>
              <p className="text-sm text-slate-500">
                {withHonorific(log.appointment.nameKana)} / {log.appointment.phoneNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge tone={log.status === "success" ? "success" : "danger"}>{log.status}</StatusBadge>
              {isRetryableType(log.type) ? <RetryNotificationButton appointmentId={log.appointment.id} type={log.type} /> : null}
            </div>
          </div>
          <dl className="mt-3 grid gap-2 text-sm text-slate-600">
            <div>
              <dt className="font-medium text-slate-800">送信先</dt>
              <dd>{log.destinationId}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">時刻</dt>
              <dd>{log.sentAt ? formatCreatedAt(log.sentAt) : formatCreatedAt(log.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-800">ペイロード</dt>
              <dd className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-slate-700">{log.payload}</dd>
            </div>
            {log.errorMessage ? (
              <div>
                <dt className="font-medium text-rose-700">エラー</dt>
                <dd className="text-rose-600">{log.errorMessage}</dd>
              </div>
            ) : null}
          </dl>
        </article>
      ))}
    </div>
  );
}
