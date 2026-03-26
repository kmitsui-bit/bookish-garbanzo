"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "@prisma/client";
import { toFormDateTime } from "@/lib/date";
import type { AppointmentFormInput } from "@/lib/validation";
import { cn } from "@/lib/utils";

type Props = {
  mode: "create" | "edit";
  initialValues?: Partial<Appointment>;
  appointmentId?: string;
};

type FieldErrors = Partial<Record<keyof AppointmentFormInput, string[]>>;

const emptyValues: AppointmentFormInput = {
  visitAtInput: "",
  telAtInput: "",
  age: "",
  gender: "A",
  nameKana: "",
  phoneNumber: "",
  electricityCost: "",
  sellPower: "",
  panelYears: "",
  gasOrEcoCute: "",
  specialConditions: "",
  detail: "",
  selfCall: false
};

function Field({
  label,
  required,
  error,
  children
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <span>{label}</span>
        {required ? <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700">必須</span> : null}
      </div>
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}

export function AppointmentForm({ mode, initialValues, appointmentId }: Props) {
  const router = useRouter();
  const initialForm = useMemo<AppointmentFormInput>(
    () => ({
      visitAtInput: initialValues?.visitAt ? toFormDateTime(initialValues.visitAt) : "",
      telAtInput: initialValues?.telAt ? toFormDateTime(initialValues.telAt) : "",
      age: initialValues?.age ? String(initialValues.age) : "",
      gender: (initialValues?.gender as "A" | "B" | "AB") ?? "A",
      nameKana: initialValues?.nameKana ?? "",
      phoneNumber: initialValues?.phoneNumber ?? "",
      electricityCost: initialValues?.electricityCost ?? "",
      sellPower: initialValues?.sellPower ?? "",
      panelYears: initialValues?.panelYears ?? "",
      gasOrEcoCute: initialValues?.gasOrEcoCute ?? "",
      specialConditions: initialValues?.specialConditions ?? "",
      detail: initialValues?.detail ?? "",
      selfCall: initialValues?.selfCall ?? false
    }),
    [initialValues]
  );

  const [values, setValues] = useState<AppointmentFormInput>(initialForm ?? emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submitUrl = mode === "create" ? "/api/appointments" : `/api/appointments/${appointmentId}`;
  const method = mode === "create" ? "POST" : "PATCH";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage("");

    const response = await fetch(submitUrl, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setErrors(data.errors ?? {});
      setMessage(data.message ?? "保存に失敗しました");
      return;
    }

    setMessage(mode === "create" ? "登録が完了しました" : "更新が完了しました");
    router.push(mode === "create" ? `/appointments/${data.appointment.id}` : `/appointments/${appointmentId}`);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="訪問日時" required error={errors.visitAtInput?.[0]}>
          <input
            className={inputClass}
            placeholder="03/21 10:00"
            value={values.visitAtInput}
            onChange={(event) => setValues((prev) => ({ ...prev, visitAtInput: event.target.value }))}
          />
        </Field>
        <Field label="☎TEL日時" required error={errors.telAtInput?.[0]}>
          <input
            className={inputClass}
            placeholder="03/20 12:00"
            value={values.telAtInput}
            onChange={(event) => setValues((prev) => ({ ...prev, telAtInput: event.target.value }))}
          />
        </Field>
        <Field label="年齢" required error={errors.age?.[0]}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={values.age}
            onChange={(event) => setValues((prev) => ({ ...prev, age: event.target.value }))}
          />
        </Field>
        <Field label="性別" required error={errors.gender?.[0]}>
          <select
            className={inputClass}
            value={values.gender}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, gender: event.target.value as "A" | "B" | "AB" }))
            }
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
          </select>
        </Field>
        <Field label="名前" required error={errors.nameKana?.[0]}>
          <input
            className={inputClass}
            placeholder="ミウラ"
            value={values.nameKana}
            onChange={(event) => setValues((prev) => ({ ...prev, nameKana: event.target.value }))}
          />
        </Field>
        <Field label="電話番号" required error={errors.phoneNumber?.[0]}>
          <input
            className={inputClass}
            inputMode="numeric"
            placeholder="08083759395"
            value={values.phoneNumber}
            onChange={(event) => setValues((prev) => ({ ...prev, phoneNumber: event.target.value }))}
          />
        </Field>
        <Field label="電気代">
          <input
            className={inputClass}
            value={values.electricityCost}
            onChange={(event) => setValues((prev) => ({ ...prev, electricityCost: event.target.value }))}
          />
        </Field>
        <Field label="売電">
          <input
            className={inputClass}
            value={values.sellPower}
            onChange={(event) => setValues((prev) => ({ ...prev, sellPower: event.target.value }))}
          />
        </Field>
        <Field label="パネル年数">
          <input
            className={inputClass}
            value={values.panelYears}
            onChange={(event) => setValues((prev) => ({ ...prev, panelYears: event.target.value }))}
          />
        </Field>
        <Field label="ガスorエコキュート">
          <input
            className={inputClass}
            value={values.gasOrEcoCute}
            onChange={(event) => setValues((prev) => ({ ...prev, gasOrEcoCute: event.target.value }))}
          />
        </Field>
      </div>

      <Field label="⭐️特殊条件">
        <textarea
          className={cn(inputClass, "min-h-28 resize-y")}
          value={values.specialConditions}
          onChange={(event) => setValues((prev) => ({ ...prev, specialConditions: event.target.value }))}
        />
      </Field>

      <Field label="詳細">
        <textarea
          className={cn(inputClass, "min-h-36 resize-y")}
          value={values.detail}
          onChange={(event) => setValues((prev) => ({ ...prev, detail: event.target.value }))}
        />
      </Field>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          checked={values.selfCall}
          onChange={(event) => setValues((prev) => ({ ...prev, selfCall: event.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        <div>
          <p className="text-sm font-medium text-slate-900">自分でTEL</p>
          <p className="text-xs text-slate-500">ON の場合は 5分前のTEL通知対象から除外されます</p>
        </div>
      </label>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>
      ) : null}

      <button
        disabled={submitting}
        className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? "保存中..." : mode === "create" ? "登録して通知する" : "更新を保存する"}
      </button>
    </form>
  );
}
