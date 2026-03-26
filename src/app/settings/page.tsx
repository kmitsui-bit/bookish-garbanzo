import { AppShell } from "@/components/app-shell";
import { SettingsForm } from "@/components/settings-form";
import { headers } from "next/headers";
import { getAppSettings } from "@/lib/settings";
import { buildWebhookUrl } from "@/lib/line-webhook";

export default async function SettingsPage() {
  const settings = await getAppSettings();
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const currentBaseUrl = host ? `${protocol}://${host}` : null;
  const webhookUrl = buildWebhookUrl(currentBaseUrl);

  return (
    <AppShell currentPath="/settings">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Settings</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">通知設定</h2>
          <p className="mt-2 text-sm text-slate-600">
            運用で変更する必要がある設定は LINE グループ ID のみに絞っています。タイムゾーンは日本時間固定です。送信モードは `.env` の `LINE_MOCK_MODE` に従います。
          </p>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Webhook URL</p>
          <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{webhookUrl}</p>
          <p className="mt-2 text-sm text-slate-500">
            LINE Developers の Webhook URL にはこのURLを設定してください。Netlify にデプロイした場合は、現在の公開URLを自動で反映します。
          </p>
        </div>
        <SettingsForm initialValues={settings} />
      </section>
    </AppShell>
  );
}
