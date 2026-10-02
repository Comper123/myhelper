import type { HabitFrequency } from "@/lib/habit-periods";

type Props = { frequency: HabitFrequency; createdAt: string; entries: string[] };
const pad = (value: number) => String(value).padStart(2, "0");
const key = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

export function HabitWeekPreview({ frequency, createdAt, entries }: Props) {
  const now = new Date();
  const today = key(now);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)));
  const creationDay = createdAt.slice(0, 10);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    const dateKey = key(date);
    const active = dateKey >= creationDay && dateKey <= today;
    const done = active && entries.includes(dateKey);
    const missed = frequency === "daily" && active && dateKey < today && !done;
    const current = dateKey === today;
    const label = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(date);
    const status = done ? "выполнено" : missed ? "пропуск" : current ? "сегодня" : active ? "без отметки" : "привычка ещё не создана";
    return { dateKey, day: new Intl.DateTimeFormat("ru-RU", { weekday: "short", timeZone: "UTC" }).format(date).replace(".", ""), done, missed, current, active, label, status };
  });
  const doneCount = days.filter((day) => day.done).length;

  return <section aria-label="Текущая неделя" className="mt-4 rounded-xl border border-[#d2d1f4] bg-gradient-to-r from-[#f7f6ff] to-white px-3 py-3 shadow-sm shadow-[#625cf0]/10">
    <div className="mb-2.5 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#656779]">Эта неделя</p><p className="text-[10px] font-medium text-[#77798a]">{frequency === "daily" ? `${doneCount}/7 дней` : doneCount ? "Отмечено на этой неделе" : "Пока без отметки"}</p></div>
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">{days.map((day) => <div key={day.dateKey} title={`${day.label}: ${day.status}`} aria-label={`${day.label}: ${day.status}`} className={`flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-lg border-2 transition-colors sm:min-h-[64px] ${day.done ? "border-[#079455] bg-[#d1fadf]" : day.missed ? "border-[#d92d20] bg-[#fee4e2]" : day.current ? "border-[#625cf0] bg-[#e7e5ff] shadow-sm shadow-[#625cf0]/20" : day.active ? "border-[#b8bfcc] bg-[#eef0f5]" : "border-[#d6d8e0] bg-[#f3f4f7]"}`}><span className={`text-[9px] capitalize sm:text-[10px] ${day.current ? "font-bold text-[#4236c5]" : day.done ? "font-semibold text-[#067647]" : day.missed ? "font-semibold text-[#b42318]" : "font-medium text-[#555a6d]"}`}>{day.day}</span><span className={`text-xs font-bold ${day.current ? "text-[#4236c5]" : day.done ? "text-[#067647]" : day.missed ? "text-[#b42318]" : "text-[#373b4d]"}`}>{day.dateKey.slice(-2)}</span><span className={`h-2.5 w-2.5 rounded-full ${day.done ? "bg-[#079455]" : day.missed ? "bg-[#d92d20]" : day.current ? "bg-[#625cf0]" : "bg-[#98a0b1]"}`}/></div>)}</div>
    {frequency !== "daily" && <p className="mt-2 text-[9px] text-[#a1a2b2]">Показываем дни реальных отметок; пропуски учитываются по {frequency === "weekly" ? "неделям" : "месяцам"}.</p>}
  </section>;
}
