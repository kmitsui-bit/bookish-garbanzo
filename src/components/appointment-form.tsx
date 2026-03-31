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
  visitAtDateInput: "",
  visitAtTimeInput: "",
  telAtDateInput: "",
  telAtTimeInput: "",
  age: "",
  gender: "A",
  nameKana: "",
  phoneNumber: "",
  electricityCostHigh: "",
  electricityCostLow: "",
  sellPowerHigh: "",
  sellPowerLow: "",
  gasCostHigh: "",
  gasCostLow: "",
  gasUsageEquipment: "",
  panelYears: "",
  gasOrEcoCute: "",
  specialConditions: "",
  detail: "",
  selfCall: false,
  telAppointment: false,
  appointmentType: "蓄電池単体"
};

function Field({
  label,
  required,
  error,
  hint,
  children
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <span>{label}</span>
        {hint ? <span className="text-xs font-normal text-slate-400">{hint}</span> : null}
        {required ? <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700">必須</span> : null}
      </div>
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}

export function AppointmentForm({ mode, initialValues, appointmentId }: Props) {
  const router = useRouter();

  const initialForm = useMemo<AppointmentFormInput>(() => {
    const visitDt = initialValues?.visitAt ? toFormDateTime(initialValues.visitAt) : "";
    const [visitAtDateInput = "", visitAtTimeInput = ""] = visitDt.split(" ");
    const telDt = initialValues?.telAt ? toFormDateTime(initialValues.telAt) : "";
    const [telAtDateInput = "", telAtTimeInput = ""] = telDt.split(" ");

    return {
      visitAtDateInput,
      visitAtTimeInput,
      telAtDateInput,
      telAtTimeInput,
      age: initialValues?.age ? String(initialValues.age) : "",
      gender: (initialValues?.gender as "A" | "B" | "AB" | "C") ?? "A",
      nameKana: initialValues?.nameKana ?? "",
      phoneNumber: initialValues?.phoneNumber ?? "",
      electricityCostHigh: initialValues?.electricityCostHigh ?? "",
      electricityCostLow: initialValues?.electricityCostLow ?? "",
      sellPowerHigh: initialValues?.sellPowerHigh ?? "",
      sellPowerLow: initialValues?.sellPowerLow ?? "",
      gasCostHigh: initialValues?.gasCostHigh ?? "",
      gasCostLow: initialValues?.gasCostLow ?? "",
      gasUsageEquipment: initialValues?.gasUsageEquipment ?? "",
      panelYears: initialValues?.panelYears ?? "",
      gasOrEcoCute: initialValues?.gasOrEcoCute ?? "",
      specialConditions: initialValues?.specialConditions ?? "",
      detail: initialValues?.detail ?? "",
      selfCall: initialValues?.selfCall ?? false,
      telAppointment: initialValues?.telAppointment ?? false,
      appointmentType: (initialValues?.appointmentType as "蓄電池単体" | "創蓄☀️") ?? "蓄電池単体"
    };
  }, [initialValues]);

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

      {/* テレアポ チェックボックス */}
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          checked={values.telAppointment}
          onChange={(event) => setValues((prev) => ({ ...prev, telAppointment: event.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        <div>
          <p className="text-sm font-medium text-slate-900">テレアポ</p>
          <p className="text-xs text-slate-500">ON の場合は 5分前のTEL通知対象から除外されます</p>
        </div>
      </label>

      {/* 種別プルダウン */}
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-800">種別</span>
        <select
          className={inputClass}
          value={values.appointmentType}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, appointmentType: event.target.value as "蓄電池単体" | "創蓄☀️" }))
          }
        >
          <option value="蓄電池単体">蓄電池単体</option>
          <option value="創蓄☀️">創蓄☀️</option>
        </select>
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        {/* 訪問日時 */}
        <Field label="訪問日時" required error={errors.visitAtDateInput?.[0] ?? errors.visitAtTimeInput?.[0]}>
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="03/21"
              value={values.visitAtDateInput}
              onChange={(event) => setValues((prev) => ({ ...prev, visitAtDateInput: event.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="10:00"
              value={values.visitAtTimeInput}
              onChange={(event) => setValues((prev) => ({ ...prev, visitAtTimeInput: event.target.value }))}
            />
          </div>
        </Field>

        {/* TEL日時 */}
        <Field label="☎TEL日時" required error={errors.telAtDateInput?.[0] ?? errors.telAtTimeInput?.[0]}>
          <div className="flex gap-2">
            <input
              className={inputClass}
              placeholder="03/20"
              value={values.telAtDateInput}
              onChange={(event) => setValues((prev) => ({ ...prev, telAtDateInput: event.target.value }))}
            />
            <input
              className={inputClass}
              placeholder="12:00"
              value={values.telAtTimeInput}
              onChange={(event) => setValues((prev) => ({ ...prev, telAtTimeInput: event.target.value }))}
            />
          </div>
        </Field>

        {/* 年齢 */}
        <Field label="年齢" required error={errors.age?.[0]}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={values.age}
            onChange={(event) => setValues((prev) => ({ ...prev, age: event.target.value }))}
          />
        </Field>

        {/* 性別 */}
        <Field label="性別" required error={errors.gender?.[0]}>
          <select
            className={inputClass}
            value={values.gender}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, gender: event.target.value as "A" | "B" | "AB" | "C" }))
            }
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
            <option value="C">C</option>
          </select>
        </Field>

        {/* 名前 */}
        <Field label="名前" hint="カタカナ入力欄" required error={errors.nameKana?.[0]}>
          <input
            className={inputClass}
            value={values.nameKana}
            onChange={(event) => setValues((prev) => ({ ...prev, nameKana: event.target.value }))}
          />
        </Field>

        {/* 電話番号 */}
        <Field label="電話番号" hint="ハイフンなし" required error={errors.phoneNumber?.[0]}>
          <input
            className={inputClass}
            inputMode="numeric"
            value={values.phoneNumber}
            onChange={(event) => setValues((prev) => ({ ...prev, phoneNumber: event.target.value }))}
          />
        </Field>

        {/* 電気代 High */}
        <Field label="電気代（High）">
          <input
            className={inputClass}
            value={values.electricityCostHigh}
            onChange={(event) => setValues((prev) => ({ ...prev, electricityCostHigh: event.target.value }))}
          />
        </Field>

        {/* 電気代 Low */}
        <Field label="電気代（Low）">
          <input
            className={inputClass}
            value={values.electricityCostLow}
            onChange={(event) => setValues((prev) => ({ ...prev, electricityCostLow: event.target.value }))}
          />
        </Field>

        {/* 売電 High */}
        <Field label="売電（High）">
          <input
            className={inputClass}
            value={values.sellPowerHigh}
            onChange={(event) => setValues((prev) => ({ ...prev, sellPowerHigh: event.target.value }))}
          />
        </Field>

        {/* 売電 Low */}
        <Field label="売電（Low）">
          <input
            className={inputClass}
            value={values.sellPowerLow}
            onChange={(event) => setValues((prev) => ({ ...prev, sellPowerLow: event.target.value }))}
          />
        </Field>

        {/* ガス代 High */}
        <Field label="ガス代（High）" hint="任意">
          <input
            className={inputClass}
            value={values.gasCostHigh}
            onChange={(event) => setValues((prev) => ({ ...prev, gasCostHigh: event.target.value }))}
          />
        </Field>

        {/* ガス代 Low */}
        <Field label="ガス代（Low）" hint="任意">
          <input
            className={inputClass}
            value={values.gasCostLow}
            onChange={(event) => setValues((prev) => ({ ...prev, gasCostLow: event.target.value }))}
          />
        </Field>

        {/* パネル年数 */}
        <Field label="パネル年数" hint="〇年目">
          <input
            className={inputClass}
            value={values.panelYears}
            onChange={(event) => setValues((prev) => ({ ...prev, panelYears: event.target.value }))}
          />
        </Field>

        {/* 給湯設備 */}
        <Field label="給湯設備">
          <input
            className={inputClass}
            value={values.gasOrEcoCute}
            onChange={(event) => setValues((prev) => ({ ...prev, gasOrEcoCute: event.target.value }))}
          />
        </Field>

        {/* ガス使用設備 */}
        <div className="md:col-span-2">
          <Field label="ガス使用設備">
            <input
              className={inputClass}
              placeholder="キッチン、床暖房など"
              value={values.gasUsageEquipment}
              onChange={(event) => setValues((prev) => ({ ...prev, gasUsageEquipment: event.target.value }))}
            />
          </Field>
        </div>
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
