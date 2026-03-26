"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialValues: {
    lineGroupId: string;
    timezone: string;
    lineMockMode: boolean;
  };
};

export function SettingsForm({ initialValues }: Props) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.message ?? "設定の保存に失敗しました");
      return;
    }

    setMessage("設定を保存しました");
    router.refresh();
  }

  async function handleLineCheck() {
    setChecking(true);
    setMessage("");

    const response = await fetch("/api/line/check", {
      method: "POST"
    });

    const data = await response.json();
    setChecking(false);
    setMessage(data.message ?? (response.ok ? "接続確認に成功しました" : "接続確認に失敗しました"));
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-800">LINEグループID</span>
        <input
          className={inputClass}
          value={values.lineGroupId}
          onChange={(event) => setValues((prev) => ({ ...prev, lineGroupId: event.target.value }))}
        />
      </label>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        タイムゾーン: <span className="font-semibold text-slate-900">{values.timezone}</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        通知モード: <span className="font-semibold text-slate-900">{values.lineMockMode ? "モック送信" : "実LINE送信"}</span>
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          disabled={saving}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? "保存中..." : "設定を保存"}
        </button>
        <button
          type="button"
          onClick={handleLineCheck}
          disabled={checking}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {checking ? "確認中..." : "LINE接続チェック"}
        </button>
      </div>
    </form>
  );
}
