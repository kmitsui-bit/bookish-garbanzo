"use client";

import { useRouter } from "next/navigation";

export function DeleteAppointmentButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    const accepted = window.confirm("このアポイントを削除しますか？");
    if (!accepted) return;

    const response = await fetch(`/api/appointments/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      window.alert("削除に失敗しました。時間をおいて再度お試しください。");
      return;
    }

    router.push("/appointments");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
    >
      削除
    </button>
  );
}
