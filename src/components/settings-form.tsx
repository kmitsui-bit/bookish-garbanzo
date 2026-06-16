"use client";

import { useState } from "react";

type Props = {
  initialValues: {
    lineGroupId: string;
    telReminderLineGroupId: string;
    timezone: string;
    lineMockMode: boolean;
  };
};

export function SettingsForm({ initialValues }: Props) {
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleLineCheck() {
    setChecking(true);
    setMessage("");

    const response = await fetch("/api/line/check", { method: "POST" });
    const data = await response.json() as { message?: string };
    setChecking(false);
    setMessage(data.message ?? (response.ok ? "接続確認に成功しました" : "接続確認に失敗しました"));
  }

  const displayClass =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm";

  return (
    <div className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-800">LINEグループID（アポ通知用）</p>
        <p className="text-xs text-slate-500">変更するには環境変数 LINE_GROUP_ID を更新してください。</p>
        <div className={displayClass}>{initialValues.lineGroupId || "（未設定）"}</div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-800">LINEグループID（TELリマインド用）</p>
        <p className="text-xs text-slate-500">変更するには環境変数 TEL_REMINDER_LINE_GROUP_ID を更新してください。</p>
        <div className={displayClass}>{initialValues.telReminderLineGroupId || "（未設定、アポ通知用と共用）"}</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        タイムゾーン: <span className="font-semibold text-slate-900">{initialValues.timezone}</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        通知モード: <span className="font-semibold text-slate-900">{initialValues.lineMockMode ? "モック送信" : "実LINE送信"}</span>
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <button
        type="button"
        onClick={handleLineCheck}
        disabled={checking}
        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {checking ? "確認中..." : "LINE接続チェック"}
      </button>
    </div>
  );
}
