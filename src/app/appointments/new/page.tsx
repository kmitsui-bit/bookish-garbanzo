import { AppShell } from "@/components/app-shell";
import { AppointmentForm } from "@/components/appointment-form";

export default function NewAppointmentPage() {
  return (
    <AppShell currentPath="/appointments/new">
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Form</p>
          <h2 className="text-3xl font-semibold text-slate-900">アポイント登録</h2>
        </div>
        <AppointmentForm mode="create" />
      </section>
    </AppShell>
  );
}
