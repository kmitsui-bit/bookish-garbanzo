"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BulkResendFailedButton({
  q,
  type,
  status
}: {
  q: string;
  type: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const response = await fetch("/api/notifications/resend-failed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q, type, status })
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      window.alert(data.message ?? "失敗ログの一括再送に失敗しました。");
      return;
    }

    window.alert(`一括再送を実行しました。対象 ${data.targetCount} 件 / 成功 ${data.successCount} 件 / 失敗 ${data.failedCount} 件`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 disabled:cursor-not-allowed disabled:text-amber-400"
    >
      {loading ? "一括再送中..." : "失敗ログを一括再送"}
    </button>
  );
}
