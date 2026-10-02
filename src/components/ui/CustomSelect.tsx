"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export type SelectOption = { value: string; label: string; color?: string };
type Props = { name?: string; options: SelectOption[]; defaultValue?: string; className?: string; ariaLabel?: string; placeholder?: string; onValueChange?: (value: string) => void };

export function CustomSelect({ name, options, defaultValue = "", className = "", ariaLabel, placeholder, onValueChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return <div className={`relative ${className}`}>
    {name && <input type="hidden" name={name} value={value}/>}
    <button type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }} className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-[#e7e7ee] bg-white px-3 py-2.5 text-left text-xs text-[#525466] outline-none transition hover:border-[#d7d5f8] focus:border-[#817beb] focus:ring-4 focus:ring-[#625cf014]">
      <span className="flex min-w-0 items-center gap-2 truncate">{selected?.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: selected.color }}/>}<span className="truncate">{selected?.label ?? placeholder ?? "Выберите…"}</span></span>
      <svg className={`h-4 w-4 shrink-0 text-[#999baa] transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
    {open && <><button type="button" aria-label="Закрыть список" className="fixed inset-0 z-20 cursor-default" onClick={() => setOpen(false)}/><div role="listbox" aria-label={ariaLabel} className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-64 min-w-full overflow-y-auto rounded-xl border border-[#e9e9f0] bg-white p-1.5 shadow-xl shadow-[#29254a]/10">{options.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => { setValue(option.value); onValueChange?.(option.value); setOpen(false); }} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${option.value === value ? "bg-[#f0efff] font-medium text-[#5e58e8]" : "text-[#525466] hover:bg-[#f7f7fb]"}`}>{option.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: option.color }}/>}<span className="min-w-0 flex-1 truncate">{option.label}</span>{option.value === value && <Check aria-hidden="true" size={14} className="shrink-0"/>}</button>)}</div></>}
  </div>;
}
