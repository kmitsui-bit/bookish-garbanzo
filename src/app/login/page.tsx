"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    setLoading(false);

    if (!response.ok) {
      setError("IDまたはパスワードが正しくありません");
      return;
    }

    router.push("/appointments/new");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef4ff_45%,_#f8fafc_100%)] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Sales Ops</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">アポイント通知システム</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">ログインID</label>
            <input
              className={inputClass}
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">パスワード</label>
            <input
              className={inputClass}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
