"use client";

import { useMemo, useState } from "react";
import type { HabitFrequency } from "@/lib/habit-periods";

type Range = "week" | "month" | "all";
type Props = { frequency: HabitFrequency; createdAt: string; entries: string[] };
const DAY = 86_400_000;
const iso = (date: Date) => date.toISOString().slice(0, 10);
const monday = (date: Date) => { const d = new Date(date); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d; };
const addDays = (date: Date, amount: number) => new Date(date.getTime() + amount * DAY);
const startOfMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const addMonths = (date: Date, amount: number) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));

export function HabitHistory({ frequency, createdAt, entries }: Props) {
  const [range, setRange] = useState<Range>("month");
  const today = iso(new Date());
  const creationDate = createdAt.slice(0, 10);
  const data = useMemo(() => {
    const now = new Date(`${today}T00:00:00.000Z`);
    const created = new Date(`${creationDate}T00:00:00.000Z`);
    const currentStart = frequency === "daily" ? now : frequency === "weekly" ? monday(now) : startOfMonth(now);
    let from: Date;
    let to: Date;
    if (range === "week") { from = monday(now); to = addDays(from, 7); }
    else if (range === "month") { from = startOfMonth(now); to = addMonths(from, 1); }
    else { from = created; to = addDays(now, 1); }
    let cursor = frequency === "daily" ? new Date(from) : frequency === "weekly" ? monday(from) : startOfMonth(from);
    const buckets: { key: string; done: boolean; missed: boolean; current: boolean; label: string }[] = [];
    while (cursor < to) {
      const next = frequency === "daily" ? addDays(cursor, 1) : frequency === "weekly" ? addDays(cursor, 7) : addMonths(cursor, 1);
      if (next > created && cursor <= now) {
        const key = iso(cursor);
        const done = entries.some((entry) => entry >= key && entry < iso(next));
        const isCurrent = key === iso(currentStart);
        const missed = !done && next <= now;
        const label = frequency === "monthly" ? new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric", timeZone: "UTC" }).format(cursor) : frequency === "weekly" ? `Неделя с ${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" }).format(cursor)}` : new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(cursor);
        buckets.push({ key, done, missed, current: isCurrent, label });
      }
      cursor = next;
    }
    return buckets;
  }, [creationDate, entries, frequency, range, today]);

  const status = (bucket: (typeof data)[number]) => bucket.done ? "Выполнено" : bucket.missed ? "Пропущено" : "В процессе";
  const rangeOptions: [Range, string][] = [["week", "Неделя"], ["month", "Месяц"], ["all", "Всё время"]];
  const cellColor = (bucket: (typeof data)[number]) => bucket.done ? "border-[#078348] bg-[#12b76a] shadow-sm shadow-green-900/20" : bucket.missed ? "border-[#c43232] bg-[#f04438] shadow-sm shadow-red-900/15" : bucket.current ? "border-[#5145cd] bg-[#b8b2ff] ring-2 ring-inset ring-[#817beb]" : "border-[#aeb4c2] bg-[#d0d5dd]";

  return <section className="mt-4 rounded-xl border border-[#d8d8e6] bg-[#f8f8ff] p-3 sm:p-4" aria-label="История привычки">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-semibold text-[#444657]">История выполнения</p><p className="mt-1 text-[10px] text-[#999baa]">Зелёный — выполнено · красный — пропуск · светлый — текущий период</p></div>
      <div className="flex rounded-lg border border-[#e9e9f0] bg-white p-0.5" role="tablist" aria-label="Период истории">{rangeOptions.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={range === value} onClick={() => setRange(value)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-medium transition ${range === value ? "bg-[#f0efff] text-[#5e58e8]" : "text-[#858697] hover:text-[#525466]"}`}>{label}</button>)}</div>
    </div>
    <div className="mt-4 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        <div className="mr-1 flex flex-col justify-between py-0.5 text-[9px] text-[#999baa]">{frequency === "daily" ? <><span>Пн</span><span>Ср</span><span>Пт</span></> : <><span>{frequency === "weekly" ? "Нед." : "Периоды"}</span><span/></>}</div>
        {frequency === "daily" ? (() => {
          const cells: ((typeof data)[number] | null)[][] = [];
          const first = data.length ? new Date(`${data[0].key}T00:00:00.000Z`) : null;
          if (!first) return <p className="py-2 text-xs text-[#999baa]">История появится после начала привычки.</p>;
          const leading = (first.getUTCDay() + 6) % 7;
          const weeks: ((typeof data)[number] | null)[][] = Array.from({ length: Math.ceil((leading + data.length) / 7) }, () => Array(7).fill(null));
          data.forEach((item, i) => { weeks[Math.floor((leading + i) / 7)][(leading + i) % 7] = item; });
          cells.push(...weeks);
          return cells.map((week, wi) => <div key={wi} className="flex flex-col gap-1.5">{week.map((bucket, di) => bucket ? <span key={bucket.key} title={`${bucket.label}: ${status(bucket)}`} aria-label={`${bucket.label}: ${status(bucket)}`} className={`h-4 w-4 rounded-[4px] border sm:h-[18px] sm:w-[18px] ${cellColor(bucket)}`} /> : <span key={`empty-${wi}-${di}`} className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />)}</div>);
        })() : data.map((bucket) => <div key={bucket.key} className="flex w-10 flex-col items-center gap-2"><span title={`${bucket.label}: ${status(bucket)}`} aria-label={`${bucket.label}: ${status(bucket)}`} className={`h-7 w-7 rounded-md border-2 ${cellColor(bucket)}`} /><span className="max-w-10 truncate text-[9px] text-[#737588]">{frequency === "monthly" ? bucket.key.slice(2, 4) : bucket.key.slice(5)}</span></div>)}
      </div>
    </div>
    <p className="mt-2 text-[10px] text-[#a1a2b2]">{data.filter((bucket) => bucket.done).length} выполнено · {data.filter((bucket) => bucket.missed).length} пропущено за период</p>
  </section>;
}
