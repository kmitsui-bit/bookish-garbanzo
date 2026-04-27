"use client";

import { useState, useRef, useEffect } from "react";
import { format, parse, isValid, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";
import { ja } from "date-fns/locale";

interface DateInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  className?: string;
  name?: string;
}

const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

export function DateInput({ value, onChange, className, name }: DateInputProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : new Date();
    return isValid(parsed) ? parsed : new Date();
  });
  const ref = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const validSelected = selectedDate && isValid(selectedDate) ? selectedDate : null;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const calDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 })
  });

  function handleSelect(day: Date) {
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  function handleOpen() {
    if (validSelected) setViewDate(validSelected);
    setOpen(true);
  }

  return (
    <div ref={ref} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <input
        type="text"
        readOnly
        value={validSelected ? format(validSelected, "yyyy/MM/dd") : ""}
        onClick={handleOpen}
        placeholder="yyyy/mm/dd"
        className={className}
      />
      {open && (
        <div className="absolute left-0 z-50 mt-1 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))} className="rounded-lg px-3 py-1 text-lg text-slate-400 hover:bg-slate-100">‹</button>
            <span className="text-sm font-semibold text-slate-800">
              {format(viewDate, "yyyy年M月", { locale: ja })}
            </span>
            <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))} className="rounded-lg px-3 py-1 text-lg text-slate-400 hover:bg-slate-100">›</button>
          </div>
          <div className="grid grid-cols-7 text-center">
            {DAY_LABELS.map((d, i) => (
              <div key={d} className={`py-1 text-xs font-medium ${i === 5 ? "text-blue-400" : i === 6 ? "text-red-400" : "text-slate-400"}`}>{d}</div>
            ))}
            {calDays.map((day) => {
              const isSelected = validSelected && isSameDay(day, validSelected);
              const isCurrentMonth = isSameMonth(day, viewDate);
              const dayOfWeek = (day.getDay() + 6) % 7; // 月=0, 土=5, 日=6
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={[
                    "mx-auto my-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm transition",
                    isSelected ? "bg-sky-600 text-white" :
                      !isCurrentMonth ? "text-slate-300" :
                      isToday(day) ? "font-bold text-sky-600 hover:bg-sky-50" :
                      dayOfWeek === 5 ? "text-blue-500 hover:bg-slate-100" :
                      dayOfWeek === 6 ? "text-red-500 hover:bg-slate-100" :
                      "text-slate-700 hover:bg-slate-100"
                  ].join(" ")}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
            <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-xs text-slate-400 hover:text-slate-600">削除</button>
            <button type="button" onClick={() => handleSelect(new Date())} className="text-xs text-sky-600 hover:text-sky-700">今日</button>
          </div>
        </div>
      )}
    </div>
  );
}
