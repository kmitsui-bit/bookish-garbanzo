import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AppointmentForm } from "@/components/appointment-form";
import { getAppointmentById } from "@/lib/appointment-queries";
import { fetchStaffNames } from "@/lib/bt-log-sync";

export default async function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [appointment, staffNames] = await Promise.all([
    getAppointmentById(id),
    fetchStaffNames()
  ]);

  if (!appointment) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Edit</p>
          <h2 className="text-3xl font-semibold text-slate-900">アポイント編集</h2>
        </div>
        <AppointmentForm mode="edit" appointmentId={appointment.id} initialValues={appointment} staffNames={staffNames} />
      </section>
    </AppShell>
  );
}
