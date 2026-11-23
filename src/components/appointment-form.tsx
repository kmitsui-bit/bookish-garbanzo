"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Appointment } from "@prisma/client";
import { toFormDate, toFormTime, getTomorrowDate, getDateMinusOne } from "@/lib/date";
import type { AppointmentFormInput } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/date-input";
import {
  FIVE_POINT_ITEMS,
  FIVE_POINT_TOTAL,
  applyFivePointToDetail,
  buildFivePointText,
  countFivePoint,
  isFivePointUsed
} from "@/lib/five-point";

type Props = {
  mode: "create" | "edit";
  initialValues?: Partial<Appointment>;
  appointmentId?: string;
  staffNames?: string[];
  /** スタッフ一覧を取得できなかった場合の理由（取得できた場合は null） */
  staffError?: string | null;
};

type FieldErrors = Partial<Record<keyof AppointmentFormInput, string[]>>;

/** エラーサマリーの表示順・表示名（フォームの並び順に合わせる） */
const ERROR_FIELD_LABELS: Array<[keyof AppointmentFormInput, string]> = [
  ["salesName", "営業マン名"],
  ["appointmentTypeOther", "種別（自由記入）"],
  ["telApptDateInput", "☎️ TEL日時"],
  ["telApptTimeInput", "☎️ TEL日時"],
  ["visitAtDateInput", "訪問日時"],
  ["visitAtTimeInput", "訪問日時"],
  ["telAtDateInput", "☎【翌日】TEL日時"],
  ["telAtStartTimeInput", "☎【翌日】TEL日時"],
  ["telAtEndTimeInput", "☎【翌日】TEL日時"],
  ["prevDayTelAtDateInput", "☎【前日】TEL日時"],
  ["prevDayTelAtStartTimeInput", "☎【前日】TEL日時"],
  ["prevDayTelAtEndTimeInput", "☎【前日】TEL日時"],
  ["age", "年齢"],
  ["gender", "性別"],
  ["telNumberType", "TEL番号"],
  ["telNumberTypeOther", "TEL番号（その他）"],
  ["nameKana", "名前"],
  ["phoneNumber", "電話番号"],
  ["coordinates", "📍座標"],
  ["fivePointAbKuroNote", "5点：両クロ"],
  ["fivePointMeisaiNote", "5点：明細"],
  ["fivePointTableChairNote", "5点：テーブル・椅子"],
  ["fivePointExplainTimeNote", "5点：説明時間"],
  ["fivePointSokketsuNote", "5点：即決"]
];

function buildErrorSummary(errors: FieldErrors) {
  const summary: string[] = [];
  const seen = new Set<string>();

  for (const [key, label] of ERROR_FIELD_LABELS) {
    for (const message of errors[key] ?? []) {
      const text = `${label}：${message}`;
      if (seen.has(text)) continue;
      seen.add(text);
      summary.push(text);
    }
  }

  // ラベル未定義のフィールドも取りこぼさない
  const known = new Set(ERROR_FIELD_LABELS.map(([key]) => key));
  for (const [key, messages] of Object.entries(errors)) {
    if (known.has(key as keyof AppointmentFormInput)) continue;
    for (const message of messages ?? []) {
      if (seen.has(message)) continue;
      seen.add(message);
      summary.push(message);
    }
  }

  return summary;
}

/** 自由記入が必要な種別と、その入力欄の見せ方 */
const TYPE_DETAIL: Partial<Record<string, { label: string; placeholder: string }>> = {
  "その他": { label: "種別（自由記入）", placeholder: "種別を入力してください" },
  "🔋既設": { label: "🔋既設の内容", placeholder: "メーカー・容量など（例：パナソニック 5.6kWh）" },
  "🐙屋根貸し": { label: "🐙屋根貸しの内容", placeholder: "会社名など（例：〇〇ソーラー株式会社）" }
};

const emptyValues: AppointmentFormInput = {
  visitAtDateInput: "",
  visitAtTimeInput: "",
  telAtDateInput: getTomorrowDate(),
  telAtStartTimeInput: "18:00",
  telAtEndTimeInput: "20:00",
  prevDayTelAtDateInput: "",
  prevDayTelAtStartTimeInput: "18:00",
  prevDayTelAtEndTimeInput: "20:00",
  telApptDateInput: "",
  telApptTimeInput: "",
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
  coordinates: "",
  detail: "",
  selfCall: false,
  telAppointment: false,
  telSkip: false,
  appointmentType: "蓄電池単体",
  appointmentTypeOther: "",
  salesName: "",
  genderDetail: "",
  telNumberType: "",
  telNumberTypeOther: "",
  fivePointAbKuro: false,
  fivePointAbKuroNote: "",
  fivePointMeisai: false,
  fivePointMeisaiNote: "",
  fivePointTableChair: false,
  fivePointTableChairNote: "",
  fivePointExplainTime: false,
  fivePointExplainTimeNote: "",
  fivePointSokketsu: false,
  fivePointSokketsuNote: ""
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

/**
 * High / Low の2項目を1つの見出しにまとめて見せる。
 * 「どちらが高い月か」がひと目で分かるよう ▲▼ と色を付ける。
 */
function HighLowField({
  label,
  hint,
  inputClassName,
  highValue,
  lowValue,
  onHighChange,
  onLowChange
}: {
  label: string;
  hint?: string;
  inputClassName: string;
  highValue: string;
  lowValue: string;
  onHighChange: (value: string) => void;
  onLowChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <span>{label}</span>
        {hint ? <span className="text-xs font-normal text-slate-400">{hint}</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-rose-600">
            ▲ High
            <span className="font-normal text-slate-400">高い月</span>
          </span>
          <input
            className={cn(inputClassName, "bg-white px-3 py-2 text-sm")}
            value={highValue}
            onChange={(event) => onHighChange(event.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-sky-600">
            ▼ Low
            <span className="font-normal text-slate-400">安い月</span>
          </span>
          <input
            className={cn(inputClassName, "bg-white px-3 py-2 text-sm")}
            value={lowValue}
            onChange={(event) => onLowChange(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

function normalizeTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function addTwoHours(timeStr: string): string {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const totalMin = h * 60 + m + 120;
  const newH = Math.floor(totalMin / 60) % 24;
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export function AppointmentForm({ mode, initialValues, appointmentId, staffNames = [], staffError = null }: Props) {
  const router = useRouter();

  const initialForm = useMemo<AppointmentFormInput>(() => {
    const isTelAppt = initialValues?.telAppointment ?? false;
    const visitAtDateInput = !isTelAppt && initialValues?.visitAt ? toFormDate(initialValues.visitAt) : "";
    const visitAtTimeInput = !isTelAppt && initialValues?.visitAt ? toFormTime(initialValues.visitAt) : "";
    const telAtDateInput = initialValues?.telAt ? toFormDate(initialValues.telAt) : getTomorrowDate();
    const telAtStartTimeInput = initialValues?.telAt ? toFormTime(initialValues.telAt) : "18:00";
    const telAtEndTimeInput = initialValues?.telAtEnd ? toFormTime(initialValues.telAtEnd) : "20:00";
    const prevDayTelAtDateInput = initialValues?.prevDayTelAt ? toFormDate(initialValues.prevDayTelAt) : "";
    const prevDayTelAtStartTimeInput = initialValues?.prevDayTelAt ? toFormTime(initialValues.prevDayTelAt) : "18:00";
    const prevDayTelAtEndTimeInput = initialValues?.prevDayTelAtEnd ? toFormTime(initialValues.prevDayTelAtEnd) : "20:00";
    const telApptDateInput = isTelAppt && initialValues?.visitAt ? toFormDate(initialValues.visitAt) : "";
    const telApptTimeInput = isTelAppt && initialValues?.visitAt ? toFormTime(initialValues.visitAt) : "";

    return {
      visitAtDateInput,
      visitAtTimeInput,
      telAtDateInput,
      telAtStartTimeInput,
      telAtEndTimeInput,
      prevDayTelAtDateInput,
      prevDayTelAtStartTimeInput,
      prevDayTelAtEndTimeInput,
      telApptDateInput,
      telApptTimeInput,
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
      coordinates: initialValues?.coordinates ?? "",
      detail: initialValues?.detail ?? "",
      selfCall: initialValues?.selfCall ?? false,
      telAppointment: initialValues?.telAppointment ?? false,
      telSkip: (initialValues as { telSkip?: boolean })?.telSkip ?? false,
      appointmentType: (initialValues?.appointmentType as "蓄電池単体" | "創蓄☀️" | "🔋既設" | "🐙屋根貸し" | "その他") ?? "蓄電池単体",
      appointmentTypeOther: initialValues?.appointmentTypeOther ?? "",
      salesName: initialValues?.salesName ?? "",
      genderDetail: initialValues?.genderDetail ?? "",
      telNumberType:
        (initialValues?.telNumberType as "" | "A" | "B" | "固定電話" | "その他") ?? "",
      telNumberTypeOther: initialValues?.telNumberTypeOther ?? "",
      fivePointAbKuro: initialValues?.fivePointAbKuro ?? false,
      fivePointAbKuroNote: initialValues?.fivePointAbKuroNote ?? "",
      fivePointMeisai: initialValues?.fivePointMeisai ?? false,
      fivePointMeisaiNote: initialValues?.fivePointMeisaiNote ?? "",
      fivePointTableChair: initialValues?.fivePointTableChair ?? false,
      fivePointTableChairNote: initialValues?.fivePointTableChairNote ?? "",
      fivePointExplainTime: initialValues?.fivePointExplainTime ?? false,
      fivePointExplainTimeNote: initialValues?.fivePointExplainTimeNote ?? "",
      fivePointSokketsu: initialValues?.fivePointSokketsu ?? false,
      fivePointSokketsuNote: initialValues?.fivePointSokketsuNote ?? ""
    };
  }, [initialValues]);

  const [values, setValues] = useState<AppointmentFormInput>(initialForm ?? emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const errorSummary = useMemo(() => buildErrorSummary(errors), [errors]);

  // エラー内容が見えないまま止まらないよう、送信ボタン手前まで自動でスクロール
  useEffect(() => {
    if (failureCount === 0) return;
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [failureCount]);

  // 直前に詳細へ追記した5点テキスト。変更時に積み重ならないよう差し替えに使う
  const fivePointTextRef = useRef<string | null>(buildFivePointText(initialForm));

  const fivePointChecked = countFivePoint(values);
  const fivePointUsed = isFivePointUsed(values);
  // 自由記入が必要な種別かどうか
  const typeDetail = TYPE_DETAIL[values.appointmentType ?? "蓄電池単体"];
  const allFivePointChecked = fivePointChecked === FIVE_POINT_TOTAL;

  /** 5点の変更を反映しつつ、詳細欄の末尾も追従させる */
  function updateFivePoint(patch: Partial<AppointmentFormInput>) {
    const next = { ...values, ...patch };
    const nextText = buildFivePointText(next);
    const detail = applyFivePointToDetail(next.detail ?? "", nextText, fivePointTextRef.current);
    fivePointTextRef.current = nextText;
    setValues({ ...next, detail });
  }

  /** 5点OK: 下の5項目を一括で切り替える */
  function toggleAllFivePoint(checked: boolean) {
    const patch: Partial<AppointmentFormInput> = {};
    for (const item of FIVE_POINT_ITEMS) {
      (patch as Record<string, boolean>)[item.key] = checked;
    }
    updateFivePoint(patch);
  }

  const submitUrl = mode === "create" ? "/api/appointments" : `/api/appointments/${appointmentId}`;
  const method = mode === "create" ? "POST" : "PATCH";

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage("");
    setFailed(false);

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
      setFailed(true);
      setFailureCount((prev) => prev + 1);
      return;
    }

    if (mode === "create") {
      setValues({ ...emptyValues });
      // 連続登録時に前回の5点テキストを引きずらないようにする
      fivePointTextRef.current = null;
      setMessage("登録・通知が完了しました");
    } else {
      setMessage("更新が完了しました");
      router.push(`/appointments/${appointmentId}`);
      router.refresh();
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

  const dateInputClass =
    "block w-full min-w-0 max-w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

  function toPreviousDateInput(dateInput: string) {
    if (!dateInput) return "";
    try {
      return getDateMinusOne(new Date(`${dateInput}T00:00:00`));
    } catch {
      return "";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden space-y-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

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
          <p className="text-xs text-slate-500">ON の場合は TEL通知対象から除外されます</p>
        </div>
      </label>

      {/* 営業マン名 */}
      <Field label="営業マン名" required error={errors.salesName?.[0]}>
        {staffNames.length > 0 ? (
          <select
            className={inputClass}
            value={values.salesName}
            onChange={(event) => setValues((prev) => ({ ...prev, salesName: event.target.value }))}
          >
            <option value="">-- 選択してください --</option>
            {staffNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        ) : (
          <div className="space-y-2">
            {/* 一覧を取得できないときだけ自由入力に切り替わる。原因が分かるよう明示する */}
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              スタッフ一覧を取得できなかったため、一時的に自由入力になっています
              {staffError ? `（${staffError}）` : ""}。
              BT.log に登録されている表記と完全に一致する名前を入力してください。
            </p>
            <input
              className={inputClass}
              placeholder="例：三井"
              value={values.salesName}
              onChange={(event) => setValues((prev) => ({ ...prev, salesName: event.target.value }))}
            />
          </div>
        )}
      </Field>

      {/* 種別プルダウン */}
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-800">種別</span>
        <select
          className={inputClass}
          value={values.appointmentType}
          onChange={(event) => {
            const t = event.target.value as "蓄電池単体" | "創蓄☀️" | "🔋既設" | "🐙屋根貸し" | "その他";
            setValues((prev) => ({
              ...prev,
              appointmentType: t,
              // 種別を切り替えたら前の種別向けの記入は残さない
              appointmentTypeOther: TYPE_DETAIL[t] ? prev.appointmentTypeOther : "",
              specialConditions: t === "その他" ? prev.appointmentTypeOther : prev.specialConditions
            }));
          }}
        >
          <option value="蓄電池単体">蓄電池単体</option>
          <option value="創蓄☀️">創蓄☀️</option>
          <option value="🔋既設">🔋既設</option>
          <option value="🐙屋根貸し">🐙屋根貸し</option>
          <option value="その他">その他</option>
        </select>
      </label>

      {typeDetail && (
        <Field label={typeDetail.label} required error={errors.appointmentTypeOther?.[0]}>
          <input
            className={inputClass}
            placeholder={typeDetail.placeholder}
            value={values.appointmentTypeOther}
            onChange={(event) => setValues((prev) => ({
              ...prev,
              appointmentTypeOther: event.target.value,
              // その他 は従来どおり特殊条件にも反映する
              specialConditions:
                prev.appointmentType === "その他" ? event.target.value : prev.specialConditions
            }))}
          />
        </Field>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* テレアポ時: TEL日時 */}
        {values.telAppointment && (
          <div className="md:col-span-2">
            <Field label="☎️ TEL日時" required error={errors.telApptDateInput?.[0] ?? errors.telApptTimeInput?.[0]}>
              <div className="grid gap-2 overflow-hidden">
                <DateInput
                  className={dateInputClass}
                  value={values.telApptDateInput}
                  onChange={(value) => setValues((prev) => ({ ...prev, telApptDateInput: value }))}
                />
                <input
                  type="text"
                  className={inputClass}
                  inputMode="numeric"
                  placeholder="--:--"
                  maxLength={5}
                  value={values.telApptTimeInput}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      telApptTimeInput: normalizeTimeInput(event.target.value)
                    }))
                  }
                />
              </div>
            </Field>
          </div>
        )}

        {/* 訪問日時（テレアポ時は非表示） */}
        {!values.telAppointment && (
          <Field label="訪問日時" required error={errors.visitAtDateInput?.[0] ?? errors.visitAtTimeInput?.[0]}>
            <div className="grid gap-2 overflow-hidden">
              <DateInput
                className={dateInputClass}
                value={values.visitAtDateInput}
                onChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    visitAtDateInput: value,
                    prevDayTelAtDateInput: toPreviousDateInput(value)
                  }))
                }
              />
              <input
                type="text"
                className={inputClass}
                inputMode="numeric"
                placeholder="--:--"
                maxLength={5}
                value={values.visitAtTimeInput}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    visitAtTimeInput: normalizeTimeInput(event.target.value)
                  }))
                }
              />
            </div>
          </Field>
        )}

        {/* 翌日TEL日時（テレアポ時は非表示） */}
        {!values.telAppointment && (
          <div className="md:col-span-2">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-800">☎【翌日】TEL日時</span>
                <span className="text-xs text-slate-400">任意</span>
                <span className="text-sm text-rose-600">※土日は原則不可 平日が理想</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.telSkip ?? false}
                    onChange={(event) => setValues((prev) => ({ ...prev, telSkip: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-600">不要</span>
                </label>
              </div>
              {errors.telAtDateInput?.[0] && <p className="text-sm text-rose-600">{errors.telAtDateInput[0]}</p>}
              {errors.telAtStartTimeInput?.[0] && <p className="text-sm text-rose-600">{errors.telAtStartTimeInput[0]}</p>}
              {!values.telSkip && (
                <div className="grid gap-2 overflow-hidden">
                  <DateInput
                    className={dateInputClass}
                    value={values.telAtDateInput}
                    onChange={(value) => setValues((prev) => ({ ...prev, telAtDateInput: value }))}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className={inputClass}
                      inputMode="numeric"
                      placeholder="--:--"
                      autoComplete="off"
                      maxLength={5}
                      value={values.telAtStartTimeInput}
                      onChange={(event) => {
                        const normalized = normalizeTimeInput(event.target.value);
                        const end = addTwoHours(normalized);
                        setValues((prev) => ({
                          ...prev,
                          telAtStartTimeInput: normalized,
                          ...(end ? { telAtEndTimeInput: end } : {})
                        }));
                      }}
                    />
                    <span className="shrink-0 text-slate-400">-</span>
                    <input
                      type="text"
                      className={inputClass}
                      inputMode="numeric"
                      placeholder="--:--"
                      autoComplete="off"
                      maxLength={5}
                      value={values.telAtEndTimeInput}
                      onChange={(event) =>
                        setValues((prev) => ({
                          ...prev,
                          telAtEndTimeInput: normalizeTimeInput(event.target.value)
                        }))
                      }
                    />
                  </div>
                </div>
              )}
              {values.telSkip && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">不要</div>
              )}
            </div>
          </div>
        )}

        {/* 前日TEL日時（テレアポ時は非表示） */}
        {!values.telAppointment && (
          <div className="md:col-span-2">
            <Field label="☎【前日】TEL日時">
              <div className="grid gap-2 overflow-hidden">
                <DateInput
                  className={dateInputClass}
                  value={values.prevDayTelAtDateInput}
                  onChange={(value) => setValues((prev) => ({ ...prev, prevDayTelAtDateInput: value }))}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className={inputClass}
                    inputMode="numeric"
                    placeholder="--:--"
                    autoComplete="off"
                    maxLength={5}
                    value={values.prevDayTelAtStartTimeInput}
                    onChange={(event) => {
                      const normalized = normalizeTimeInput(event.target.value);
                      const end = addTwoHours(normalized);
                      setValues((prev) => ({
                        ...prev,
                        prevDayTelAtStartTimeInput: normalized,
                        ...(end ? { prevDayTelAtEndTimeInput: end } : {})
                      }));
                    }}
                  />
                  <span className="shrink-0 text-slate-400">-</span>
                  <input
                    type="text"
                    className={inputClass}
                    inputMode="numeric"
                    placeholder="--:--"
                    autoComplete="off"
                    maxLength={5}
                    value={values.prevDayTelAtEndTimeInput}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        prevDayTelAtEndTimeInput: normalizeTimeInput(event.target.value)
                      }))
                    }
                  />
                </div>
              </div>
            </Field>
          </div>
        )}

        {/* 年齢 */}
        <Field label="年齢" hint="自由入力" required error={errors.age?.[0]}>
          <input
            className={inputClass}
            placeholder="60代、30後半 など"
            value={values.age}
            onChange={(event) => setValues((prev) => ({ ...prev, age: event.target.value }))}
          />
        </Field>

        {/* 性別 */}
        <Field label="性別" required error={errors.gender?.[0]}>
          <select
            className={inputClass}
            value={values.gender}
            onChange={(event) => {
              const g = event.target.value as "A" | "B" | "AB" | "C";
              setValues((prev) => ({
                ...prev,
                gender: g,
                // AB 以外に変えたら TEL番号 の入力値を残さない
                telNumberType: g === "AB" ? prev.telNumberType : "",
                telNumberTypeOther: g === "AB" ? prev.telNumberTypeOther : ""
              }));
            }}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="AB">AB</option>
            <option value="C">C</option>
          </select>
        </Field>

        {values.gender === "AB" && (
          <div className="md:col-span-2 space-y-4">
            <Field label="TEL番号" required error={errors.telNumberType?.[0]}>
              <select
                className={inputClass}
                value={values.telNumberType ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    telNumberType: event.target.value as "" | "A" | "B" | "固定電話" | "その他",
                    // その他 以外に戻したら自由入力は残さない
                    telNumberTypeOther:
                      event.target.value === "その他" ? prev.telNumberTypeOther : ""
                  }))
                }
              >
                <option value="">-- 選択してください --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="固定電話">固定電話</option>
                <option value="その他">その他</option>
              </select>
            </Field>

            {values.telNumberType === "その他" && (
              <Field label="TEL番号（その他）" required error={errors.telNumberTypeOther?.[0]}>
                <input
                  className={inputClass}
                  placeholder="詳細を入力してください"
                  value={values.telNumberTypeOther ?? ""}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, telNumberTypeOther: event.target.value }))
                  }
                />
              </Field>
            )}
          </div>
        )}

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

        <div className="md:col-span-2 space-y-3">
          <HighLowField
            label="電気代"
            inputClassName={inputClass}
            highValue={values.electricityCostHigh ?? ""}
            lowValue={values.electricityCostLow ?? ""}
            onHighChange={(value) => setValues((prev) => ({ ...prev, electricityCostHigh: value }))}
            onLowChange={(value) => setValues((prev) => ({ ...prev, electricityCostLow: value }))}
          />
          <HighLowField
            label="売電"
            inputClassName={inputClass}
            highValue={values.sellPowerHigh ?? ""}
            lowValue={values.sellPowerLow ?? ""}
            onHighChange={(value) => setValues((prev) => ({ ...prev, sellPowerHigh: value }))}
            onLowChange={(value) => setValues((prev) => ({ ...prev, sellPowerLow: value }))}
          />
          <HighLowField
            label="ガス代"
            hint="任意"
            inputClassName={inputClass}
            highValue={values.gasCostHigh ?? ""}
            lowValue={values.gasCostLow ?? ""}
            onHighChange={(value) => setValues((prev) => ({ ...prev, gasCostHigh: value }))}
            onLowChange={(value) => setValues((prev) => ({ ...prev, gasCostLow: value }))}
          />
        </div>

        <Field label="パネル年数">
          <input
            className={inputClass}
            placeholder="〇年目"
            value={values.panelYears}
            onChange={(event) => setValues((prev) => ({ ...prev, panelYears: event.target.value }))}
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

      <Field label="📍座標" required error={errors.coordinates?.[0]}>
        <input
          className={inputClass}
          placeholder="座標"
          value={values.coordinates ?? ""}
          onChange={(event) => setValues((prev) => ({ ...prev, coordinates: event.target.value }))}
        />
      </Field>

      {/* 5点 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <span>5点</span>
          <span className="text-xs font-normal text-slate-400">
            {fivePointChecked} / {FIVE_POINT_TOTAL}
          </span>
        </div>

        {/* 5点OK: 下の5項目をまとめて切り替えるマスター。他と区別できる見た目にする */}
        <label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition",
            allFivePointChecked
              ? "border-emerald-400 bg-emerald-50 shadow-sm"
              : "border-dashed border-slate-300 bg-slate-50"
          )}
        >
          <input
            type="checkbox"
            checked={allFivePointChecked}
            onChange={(event) => toggleAllFivePoint(event.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <div>
            <p
              className={cn(
                "text-sm font-bold",
                allFivePointChecked ? "text-emerald-800" : "text-slate-900"
              )}
            >
              5点OK
            </p>
            <p className="text-xs text-slate-500">ONで下の5項目すべてにチェックが入ります</p>
          </div>
        </label>

        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
          {FIVE_POINT_ITEMS.map((item) => {
            const checked = !!values[item.key];
            // 5点を触っている場合、チェックが無い項目は記入が必須
            const noteRequired = fivePointUsed && !checked;
            const noteError = errors[item.noteKey]?.[0];

            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <label className="flex w-32 shrink-0 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        updateFivePoint({ [item.key]: event.target.checked } as Partial<AppointmentFormInput>)
                      }
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-800">{item.label}</span>
                  </label>
                  <input
                    className={cn(
                      inputClass,
                      "min-w-0 flex-1 px-3 py-2 text-sm",
                      noteError && "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                    )}
                    placeholder={noteRequired ? "理由を入力（必須）" : "メモ（任意）"}
                    value={values[item.noteKey] ?? ""}
                    onChange={(event) =>
                      updateFivePoint({ [item.noteKey]: event.target.value } as Partial<AppointmentFormInput>)
                    }
                  />
                </div>
                {noteError ? <p className="pl-[8.5rem] text-xs text-rose-600">{noteError}</p> : null}
              </div>
            );
          })}
        </div>
      </div>

      <Field label="詳細">
        <textarea
          className={cn(inputClass, "min-h-36 resize-y")}
          value={values.detail}
          onChange={(event) => setValues((prev) => ({ ...prev, detail: event.target.value }))}
        />
      </Field>

      {message ? (
        <div ref={feedbackRef} className="scroll-mt-6">
          {failed ? (
            <div role="alert" aria-live="assertive" className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3">
              <p className="text-sm font-semibold text-rose-700">⚠️ {message}</p>
              {errorSummary.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
                  {errorSummary.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div role="status" aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}
        </div>
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
