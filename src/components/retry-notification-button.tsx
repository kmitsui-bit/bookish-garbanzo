"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RetryNotificationButton({
  appointmentId,
  type
}: {
  appointmentId: string;
  type: "form_submitted" | "tel_reminder";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const response = await fetch("/api/notifications/resend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        appointmentId,
        type
      })
    });
    setLoading(false);

    if (!response.ok) {
      window.alert("通知の再送に失敗しました。設定またはログを確認してください。");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleClick}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
    >
      {loading ? "再送中..." : "手動再送"}
    </button>
  );
}
