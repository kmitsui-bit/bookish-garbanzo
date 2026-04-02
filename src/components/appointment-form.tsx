"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "@prisma/client";
import { toFormDate, toFormTime, getTomorrowDate, getDateMinusOne } from "@/lib/date";
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
  telAtDateInput: getTomorrowDate(),
  telAtStartTimeInput: "18:00",
  telAtEndTimeInput: "20:00",
  prevDayTelAtDateInput: "",
  prevDayTelAtStartTimeInput: "18:00",
  prevDayTelAtEndTimeInput: "20:00",
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
  appointmentType: "蓄電池単体",
  appointmentTypeOther: "",
  salesName: "",
  genderDetail: ""
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
    const visitAtDateInput = initialValues?.visitAt ? toFormDate(initialValues.visitAt) : "";
    const visitAtTimeInput = initialValues?.visitAt ? toFormTime(initialValues.visitAt) : "";
    const telAtDateInput = initialValues?.telAt ? toFormDate(initialValues.telAt) : getTomorrowDate();
    const telAtStartTimeInput = initialValues?.telAt ? toFormTime(initialValues.telAt) : "18:00";
    const telAtEndTimeInput = initialValues?.telAtEnd ? toFormTime(initialValues.telAtEnd) : "20:00";
    const prevDayTelAtDateInput = initialValues?.prevDayTelAt ? toFormDate(initialValues.prevDayTelAt) : "";
    const prevDayTelAtStartTimeInput = initialValues?.prevDayTelAt ? toFormTime(initialValues.prevDayTelAt) : "18:00";
    const prevDayTelAtEndTimeInput = initialValues?.prevDayTelAtEnd ? toFormTime(initialValues.prevDayTelAtEnd) : "20:00";

    return {
      visitAtDateInput,
      visitAtTimeInput,
      telAtDateInput,
      telAtStartTimeInput,
      telAtEndTimeInput,
      prevDayTelAtDateInput,
      prevDayTelAtStartTimeInput,
      prevDayTelAtEndTimeInput,
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
      appointmentType: (initialValues?.appointmentType as "蓄電池単体" | "創蓄☀️" | "その他") ?? "蓄電池単体",
      appointmentTypeOther: initialValues?.appointmentTypeOther ?? "",
      salesName: initialValues?.salesName ?? "",
      genderDetail: initialValues?.genderDetail ?? ""
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
      headers: { "Content-Type": "application/json" },
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

  const dateTimeClass =
    "w-full appearance-auto rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

  function toPreviousDateInput(dateInput: string) {
    if (!dateInput) return "";
    try {
      return getDateMinusOne(new Date(`${dateInput}T00:00:00`));
    } catch {
      return "";
    }
  }

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
          <p className="text-sm font-medium text-slate-900">テレアポ（自分でTEL）</p>
          <p className="text-xs text-slate-500">ON の場合は 5分前のTEL通知対象から除外されます</p>
        </div>
      </label>

      {/* 営業マン名 */}
      <Field label="営業マン名" hint="漢字で入力" required error={errors.salesName?.[0]}>
        <input
          className={inputClass}
          placeholder="例：三井"
          value={values.salesName}
          onChange={(event) => setValues((prev) => ({ ...prev, salesName: event.target.value }))}
        />
      </Field>

      {/* 種別プルダウン */}
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-800">種別</span>
        <select
          className={inputClass}
          value={values.appointmentType}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, appointmentType: event.target.value as "蓄電池単体" | "創蓄☀️" | "その他" }))
          }
        >
          <option value="蓄電池単体">蓄電池単体</option>
          <option value="創蓄☀️">創蓄☀️</option>
          <option value="その他">その他</option>
        </select>
      </label>

      {values.appointmentType === "その他" && (
        <Field label="種別（自由記入）" required error={errors.appointmentTypeOther?.[0]}>
          <input
            className={inputClass}
            placeholder="種別を入力してください"
            value={values.appointmentTypeOther}
            onChange={(event) => setValues((prev) => ({ ...prev, appointmentTypeOther: event.target.value }))}
          />
        </Field>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* 訪問日時 */}
        <Field label="訪問日時" required={!values.telAppointment} error={errors.visitAtDateInput?.[0] ?? errors.visitAtTimeInput?.[0]}>
          <div className="flex gap-2">
            <input
              type="date"
              className={dateTimeClass}
              value={values.visitAtDateInput}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  visitAtDateInput: event.target.value,
                  prevDayTelAtDateInput: toPreviousDateInput(event.target.value)
                }))
              }
            />
            <input
              type="time"
              className={dateTimeClass}
              value={values.visitAtTimeInput}
              onChange={(event) => setValues((prev) => ({ ...prev, visitAtTimeInput: event.target.value }))}
            />
          </div>
        </Field>

        {/* 翌日TEL日時 */}
        <div className="md:col-span-2">
          <Field label="☎【翌日】TEL日時" required error={errors.telAtDateInput?.[0] ?? errors.telAtStartTimeInput?.[0]}>
            <div className="grid gap-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
              <input
                type="date"
                className={dateTimeClass}
                value={values.telAtDateInput}
                onChange={(event) => setValues((prev) => ({ ...prev, telAtDateInput: event.target.value }))}
              />
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <input
                  type="time"
                  className={dateTimeClass}
                  value={values.telAtStartTimeInput}
                  onChange={(event) => setValues((prev) => ({ ...prev, telAtStartTimeInput: event.target.value }))}
                />
                <span className="text-center text-sm text-slate-400">-</span>
                <input
                  type="time"
                  className={dateTimeClass}
                  value={values.telAtEndTimeInput}
                  onChange={(event) => setValues((prev) => ({ ...prev, telAtEndTimeInput: event.target.value }))}
                />
              </div>
            </div>
          </Field>
        </div>

        {/* 前日TEL日時 */}
        <div className="md:col-span-2">
          <Field label="☎【前日】TEL日時">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
              <input
                type="date"
                className={dateTimeClass}
                value={values.prevDayTelAtDateInput}
                onChange={(event) => setValues((prev) => ({ ...prev, prevDayTelAtDateInput: event.target.value }))}
              />
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <input
                  type="time"
                  className={dateTimeClass}
                  value={values.prevDayTelAtStartTimeInput}
                  onChange={(event) => setValues((prev) => ({ ...prev, prevDayTelAtStartTimeInput: event.target.value }))}
                />
                <span className="text-center text-sm text-slate-400">-</span>
                <input
                  type="time"
                  className={dateTimeClass}
                  value={values.prevDayTelAtEndTimeInput}
                  onChange={(event) => setValues((prev) => ({ ...prev, prevDayTelAtEndTimeInput: event.target.value }))}
                />
              </div>
            </div>
          </Field>
        </div>

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

        {values.gender === "C" && (
          <div className="md:col-span-2">
            <Field label="C 詳細">
              <input
                className={inputClass}
                placeholder="詳細を入力してください"
                value={values.genderDetail ?? ""}
                onChange={(event) => setValues((prev) => ({ ...prev, genderDetail: event.target.value }))}
              />
            </Field>
          </div>
        )}

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
            placeholder="10桁または11桁"
            value={values.phoneNumber}
            onChange={(event) => setValues((prev) => ({ ...prev, phoneNumber: event.target.value }))}
          />
        </Field>

        <Field label="電気代（High）">
          <input className={inputClass} value={values.electricityCostHigh} onChange={(event) => setValues((prev) => ({ ...prev, electricityCostHigh: event.target.value }))} />
        </Field>
        <Field label="電気代（Low）">
          <input className={inputClass} value={values.electricityCostLow} onChange={(event) => setValues((prev) => ({ ...prev, electricityCostLow: event.target.value }))} />
        </Field>
        <Field label="売電（High）">
          <input className={inputClass} value={values.sellPowerHigh} onChange={(event) => setValues((prev) => ({ ...prev, sellPowerHigh: event.target.value }))} />
        </Field>
        <Field label="売電（Low）">
          <input className={inputClass} value={values.sellPowerLow} onChange={(event) => setValues((prev) => ({ ...prev, sellPowerLow: event.target.value }))} />
        </Field>
        <Field label="ガス代（High）" hint="任意">
          <input className={inputClass} value={values.gasCostHigh} onChange={(event) => setValues((prev) => ({ ...prev, gasCostHigh: event.target.value }))} />
        </Field>
        <Field label="ガス代（Low）" hint="任意">
          <input className={inputClass} value={values.gasCostLow} onChange={(event) => setValues((prev) => ({ ...prev, gasCostLow: event.target.value }))} />
        </Field>

        <Field label="パネル年数" hint="〇年目　数字のみ入力">
          <input
            className={inputClass}
            inputMode="numeric"
            pattern="\d*"
            placeholder="〇年目"
            value={values.panelYears}
            onChange={(event) => {
              const v = event.target.value.replace(/[^\d]/g, "");
              setValues((prev) => ({ ...prev, panelYears: v }));
            }}
          />
        </Field>

        <Field label="給湯設備名">
          <input
            className={inputClass}
            placeholder="ガス給湯器、エネファーム、エコキュートなど"
            value={values.gasOrEcoCute}
            onChange={(event) => setValues((prev) => ({ ...prev, gasOrEcoCute: event.target.value }))}
          />
        </Field>

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
