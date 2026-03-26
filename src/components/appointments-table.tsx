import Link from "next/link";
import type { Appointment, NotificationLog } from "@prisma/client";
import { formatCreatedAt, formatMonthDayTime } from "@/lib/date";
import { StatusBadge } from "@/components/status-badge";
import { withHonorific } from "@/lib/formatters";

type AppointmentRow = Appointment & {
  notificationLogs: NotificationLog[];
};

function latestNotificationStatus(logs: NotificationLog[]) {
  const success = logs.find((log) => log.status === "success");
  return success ? "送信済み" : "未送信";
}

export function AppointmentsTable({ appointments }: { appointments: AppointmentRow[] }) {
  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                {[
                  "作成日時",
                  "訪問日時",
                  "☎TEL日時",
                  "名前",
                  "年齢",
                  "性別",
                  "電話番号",
                  "電気代",
                  "売電",
                  "パネル年数",
                  "ガスorエコキュート",
                  "自分でTEL",
                  "特殊条件",
                  "詳細",
                  "通知ステータス",
                  "TEL通知対象",
                  "更新日時"
                ].map((header) => (
                  <th key={header} className="whitespace-nowrap px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="align-top hover:bg-slate-50/80">
                  <td className="px-4 py-3">{formatCreatedAt(appointment.createdAt)}</td>
                  <td className="px-4 py-3">{formatMonthDayTime(appointment.visitAt)}</td>
                  <td className="px-4 py-3">{formatMonthDayTime(appointment.telAt)}</td>
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-sky-700 hover:text-sky-800" href={`/appointments/${appointment.id}`}>
                      {withHonorific(appointment.nameKana)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{appointment.age}</td>
                  <td className="px-4 py-3">{appointment.gender}</td>
                  <td className="px-4 py-3">{appointment.phoneNumber}</td>
                  <td className="px-4 py-3">{appointment.electricityCost ?? "-"}</td>
                  <td className="px-4 py-3">{appointment.sellPower ?? "-"}</td>
                  <td className="px-4 py-3">{appointment.panelYears ?? "-"}</td>
                  <td className="px-4 py-3">{appointment.gasOrEcoCute ?? "-"}</td>
                  <td className="px-4 py-3">{appointment.selfCall ? "ON" : "OFF"}</td>
                  <td className="max-w-48 truncate px-4 py-3">{appointment.specialConditions || "-"}</td>
                  <td className="max-w-56 truncate px-4 py-3">{appointment.detail || "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={latestNotificationStatus(appointment.notificationLogs) === "送信済み" ? "success" : "warning"}>
                      {latestNotificationStatus(appointment.notificationLogs)}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={!appointment.selfCall && appointment.telReminderEnabled ? "success" : "default"}>
                      {!appointment.selfCall && appointment.telReminderEnabled ? "対象" : "対象外"}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">{formatCreatedAt(appointment.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:hidden">
        {appointments.map((appointment) => (
          <Link
            key={appointment.id}
            href={`/appointments/${appointment.id}`}
            className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-slate-900">{withHonorific(appointment.nameKana)}</p>
                <p className="mt-1 text-sm text-slate-500">{appointment.phoneNumber}</p>
              </div>
              <StatusBadge tone={!appointment.selfCall && appointment.telReminderEnabled ? "success" : "default"}>
                {!appointment.selfCall && appointment.telReminderEnabled ? "TEL対象" : "TEL対象外"}
              </StatusBadge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">訪問</dt>
                <dd className="font-medium text-slate-900">{formatMonthDayTime(appointment.visitAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">TEL</dt>
                <dd className="font-medium text-slate-900">{formatMonthDayTime(appointment.telAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">年齢 / 性別</dt>
                <dd className="font-medium text-slate-900">
                  {appointment.age} / {appointment.gender}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">通知</dt>
                <dd className="font-medium text-slate-900">{latestNotificationStatus(appointment.notificationLogs)}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}
