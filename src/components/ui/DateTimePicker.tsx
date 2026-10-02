"use client";

import { useState } from "react";
import { CustomSelect } from "./CustomSelect";

type Props = { name: string; defaultValue?: string; mode?: "date" | "datetime"; required?: boolean; placeholder?: string; className?: string };
const pad = (value: number) => String(value).padStart(2, "0");
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const shiftMonth = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

export function DateTimePicker({ name, defaultValue = "", mode = "datetime", required = false, placeholder = "Выбрать дату", className = "" }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const raw = defaultValue.slice(0, 10);
    const date = raw ? new Date(`${raw}T12:00:00`) : new Date();
    return monthStart(date);
  });
  const [time, setTime] = useState(defaultValue.slice(11, 16) || "09:00");
  const selectedDate = value.slice(0, 10);
  const [year, month] = [visibleMonth.getFullYear(), visibleMonth.getMonth()];
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const dayCount = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + dayCount) / 7) * 7 }, (_, index) => index - offset + 1);
  const displayed = selectedDate ? new Date(`${selectedDate}T12:00:00`) : null;
  const triggerText = displayed ? `${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(displayed)}${mode === "datetime" ? ` · ${time}` : ""}` : placeholder;
  const valueForForm = selectedDate ? mode === "datetime" ? `${selectedDate}T${time}` : selectedDate : "";
  const hours = Array.from({ length: 24 }, (_, hour) => ({ value: pad(hour), label: `${pad(hour)} ч` }));
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((minute) => ({ value: minute, label: `${minute} мин` }));

  return <div className={`relative ${className}`}>
    <input type="hidden" name={name} value={valueForForm}/>
    {required && !selectedDate && <span className="sr-only" aria-live="polite">Выберите дату</span>}
    <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border border-[#e7e7ee] bg-white px-3 py-2.5 text-left text-xs text-[#525466] outline-none transition hover:border-[#d7d5f8] focus:border-[#817beb] focus:ring-4 focus:ring-[#625cf014]">
      <span className={`truncate ${displayed ? "" : "text-[#aaabb7]"}`}>{triggerText}</span>
      <svg className="h-4 w-4 shrink-0 text-[#898b9c]" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 3v4M13.5 3v4M3 8.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    </button>
    {open && <><button type="button" aria-label="Закрыть календарь" className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)}/><div role="dialog" aria-label="Выбор даты и времени" className="absolute left-0 top-[calc(100%+8px)] z-30 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-[#e9e9f0] bg-white p-4 shadow-2xl shadow-[#29254a]/15">
      <div className="flex items-center justify-between"><button type="button" aria-label="Предыдущий месяц" onClick={() => setVisibleMonth(shiftMonth(visibleMonth, -1))} className="grid h-8 w-8 place-items-center rounded-lg text-lg text-[#77798a] hover:bg-[#f5f5fa]">‹</button><p className="text-sm font-semibold capitalize">{new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(visibleMonth)}</p><button type="button" aria-label="Следующий месяц" onClick={() => setVisibleMonth(shiftMonth(visibleMonth, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-lg text-[#77798a] hover:bg-[#f5f5fa]">›</button></div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => <span key={day} className="py-1 text-[9px] font-semibold uppercase text-[#a1a2b2]">{day}</span>)}{cells.map((day, index) => day < 1 || day > dayCount ? <span key={`empty-${index}`} className="h-8"/> : <button key={day} type="button" onClick={() => { setValue(`${year}-${pad(month + 1)}-${pad(day)}`); if (mode === "date") setOpen(false); }} className={`h-8 rounded-lg text-xs transition ${selectedDate === `${year}-${pad(month + 1)}-${pad(day)}` ? "bg-[#625cf0] font-semibold text-white" : dateKey(new Date()) === `${year}-${pad(month + 1)}-${pad(day)}` ? "bg-[#f0efff] font-semibold text-[#5e58e8]" : "text-[#525466] hover:bg-[#f5f5fa]"}`}>{day}</button>)}</div>
      {mode === "datetime" && <div className="mt-4 border-t border-[#f0f0f4] pt-3"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#999baa]">Время</p><div className="grid grid-cols-2 gap-2"><CustomSelect ariaLabel="Час" defaultValue={time.slice(0, 2)} onValueChange={(hour) => setTime(`${hour}:${time.slice(3, 5)}`)} options={hours}/><CustomSelect ariaLabel="Минуты" defaultValue={time.slice(3, 5)} onValueChange={(minute) => setTime(`${time.slice(0, 2)}:${minute}`)} options={minutes}/></div><div className="mt-3 flex justify-end"><button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-[#625cf0] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#514be0]">Готово</button></div></div>}
    </div></>}
  </div>;
}
