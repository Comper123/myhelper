import Link from "next/link";
import { Plus } from "lucide-react";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ModuleShell } from "@/components/app/ModuleShell";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { authOptions } from "@/auth";
import { db } from "@/db";
import { calendars, tasks } from "@/db/schema";
import { createCalendar, deleteCalendar } from "../modules/actions";

type View = "day" | "three" | "week" | "month";
type Search = Promise<{ error?: string; created?: string; month?: string; date?: string; view?: string; calendar?: string }>;
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const localDateTime = (date: Date) => `${dayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
const atMidnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfWeek = (date: Date) => addDays(atMidnight(date), -((date.getDay() + 6) % 7));
const viewNames: Record<View, string> = { day: "День", three: "3 дня", week: "Неделя", month: "Месяц" };

function validDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export default async function CalendarsPage({ searchParams }: { searchParams: Search }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect("/auth/login");
  const params = await searchParams;
  const view: View = params.view === "day" || params.view === "three" || params.view === "week" ? params.view : "month";
  const legacyMonth = params.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month) ? new Date(Number(params.month.slice(0, 4)), Number(params.month.slice(5, 7)) - 1, 1) : null;
  const selectedDate = validDate(params.date) ?? legacyMonth ?? atMidnight(new Date());
  const rangeStart = view === "month" ? startOfWeek(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)) : view === "week" ? startOfWeek(selectedDate) : atMidnight(selectedDate);
  const monthDays = view === "month" ? Math.ceil(((new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay() + 6) % 7 + new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()) / 7) * 7 : 0;
  const visibleDayCount = view === "day" ? 1 : view === "three" ? 3 : view === "week" ? 7 : monthDays;
  const rangeEnd = addDays(rangeStart, visibleDayCount);
  const [calendarList, rangeTasks] = await Promise.all([
    db.select().from(calendars).where(eq(calendars.userId, session.user.id)).orderBy(asc(calendars.name)),
    db.select().from(tasks).where(and(eq(tasks.userId, session.user.id), gte(tasks.dueAt, rangeStart), lt(tasks.dueAt, rangeEnd))).orderBy(asc(tasks.dueAt)),
  ]);
  const selectedCalendar = calendarList.some((calendar) => calendar.id === params.calendar) ? params.calendar! : "";
  const shownTasks = selectedCalendar ? rangeTasks.filter((task) => task.calendarId === selectedCalendar) : rangeTasks;
  const eventsByDay = new Map<string, typeof shownTasks>();
  for (const task of shownTasks) if (task.dueAt) {
    const key = dayKey(task.dueAt);
    eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), task]);
  }
  const days = Array.from({ length: visibleDayCount }, (_, i) => addDays(rangeStart, i));
  const today = dayKey(new Date());
  const currentMonth = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(selectedDate);
  const rangeLabel = view === "month" ? currentMonth : view === "day" ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(selectedDate) : `${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(rangeStart)} — ${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(addDays(rangeEnd, -1))}`;
  const shift = view === "day" ? 1 : view === "three" ? 3 : view === "week" ? 7 : 0;
  const previous = view === "month" ? new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1) : addDays(selectedDate, -shift);
  const next = view === "month" ? new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1) : addDays(selectedDate, shift);
  const queryHref = (date: Date, nextView = view) => `/app/calendars?view=${nextView}&date=${dayKey(date)}${selectedCalendar ? `&calendar=${selectedCalendar}` : ""}`;
  const taskHref = (date: Date) => `/app/tasks?due=${localDateTime(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0))}`;
  const hours = Array.from({ length: 24 }, (_, hour) => hour);

  return <ModuleShell active="Календари" userLabel={session.user.name ?? session.user.email ?? "Аккаунт"}>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[10px] font-semibold tracking-[.14em] text-[#898b9c]">ПЛАНИРОВАНИЕ</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Календарь</h1><p className="mt-2 text-sm text-[#858697]">Просматривайте задачи по дням, неделям и месяцам.</p></div><Link href={taskHref(selectedDate)} className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#625cf0] to-[#817beb] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#625cf0]/20 transition hover:brightness-105"><Plus aria-hidden="true" size={16}/>Событие</Link></div>

    <section className="mt-6 overflow-hidden rounded-2xl border border-[#dedff0] bg-white shadow-sm shadow-[#29254a]/[.04]">
      <div className="border-b border-[#e9e9f0] p-3 sm:p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2"><Link aria-label="Предыдущий период" href={queryHref(previous)} className="grid h-9 w-9 place-items-center rounded-xl border border-[#dfe0ea] text-lg text-[#64667a] transition hover:border-[#bcb8ff] hover:bg-[#f3f2ff] hover:text-[#514be0]">‹</Link><h2 className="min-w-44 text-center text-sm font-semibold capitalize text-[#303247] sm:text-base">{rangeLabel}</h2><Link aria-label="Следующий период" href={queryHref(next)} className="grid h-9 w-9 place-items-center rounded-xl border border-[#dfe0ea] text-lg text-[#64667a] transition hover:border-[#bcb8ff] hover:bg-[#f3f2ff] hover:text-[#514be0]">›</Link><Link href={queryHref(atMidnight(new Date()))} className="ml-1 rounded-lg bg-[#eeedff] px-3 py-2 text-[11px] font-semibold text-[#514be0] transition hover:bg-[#e4e2ff]">Сегодня</Link></div>
          <nav aria-label="Режим календаря" className="flex w-fit rounded-xl bg-[#f0f1f7] p-1">{(Object.entries(viewNames) as [View, string][]).map(([value, label]) => <Link key={value} href={queryHref(selectedDate, value)} aria-current={view === value ? "page" : undefined} className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition sm:px-4 ${view === value ? "bg-white text-[#514be0] shadow-sm ring-1 ring-[#e2e1f4]" : "text-[#717387] hover:text-[#393b52]"}`}>{label}</Link>)}</nav>
        </div>
        <form action="/app/calendars" className="mt-3 flex items-center gap-2"><input type="hidden" name="view" value={view}/><input type="hidden" name="date" value={dayKey(selectedDate)}/><label className="sr-only" htmlFor="calendar-filter">Фильтр по календарю</label><CustomSelect name="calendar" ariaLabel="Фильтр по календарю" defaultValue={selectedCalendar} className="w-full max-w-60" options={[{ value: "", label: "Все календари" }, ...calendarList.map((calendar) => ({ value: calendar.id, label: calendar.name, color: calendar.color }))]}/><button className="rounded-xl bg-[#eeedff] px-3 py-2.5 text-xs font-semibold text-[#514be0] transition hover:bg-[#e4e2ff]">Фильтр</button></form>
      </div>

      {view === "month" ? <div className="p-3 sm:p-5">
        <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-[#d9dbe6] bg-white">{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((label, i) => <div key={label} className={`border-b border-[#d9dbe6] bg-[#f3f4fa] py-2.5 text-center text-[10px] font-bold uppercase tracking-wide ${i ? "border-l" : ""} ${i > 4 ? "text-[#77739e]" : "text-[#65677c]"}`}>{label}</div>)}{days.map((day) => { const key = dayKey(day); const events = eventsByDay.get(key) ?? []; const inMonth = day.getMonth() === selectedDate.getMonth(); const isToday = key === today; return <div key={key} className={`min-h-[92px] border-b border-[#d9dbe6] p-1.5 sm:min-h-[112px] sm:p-2 ${inMonth ? "bg-white hover:bg-[#fafaff]" : "bg-[#f3f4f8]"} ${day.getDay() !== 1 ? "border-l" : ""}`}><div className="flex items-center justify-between"><span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] ${isToday ? "bg-[#625cf0] font-bold text-white shadow-sm" : inMonth ? "font-medium text-[#404257]" : "text-[#999baa]"}`}>{day.getDate()}</span><Link aria-label={`Добавить задачу на ${day.toLocaleDateString("ru-RU")}`} href={taskHref(day)} className="grid h-7 w-7 place-items-center rounded-lg text-sm text-[#8e8ca6] transition hover:bg-[#eeedff] hover:text-[#514be0]"><Plus aria-hidden="true" size={14}/></Link></div><div className="mt-1.5 space-y-1">{events.slice(0, 2).map((task) => { const calendar = calendarList.find((item) => item.id === task.calendarId); return <div key={task.id} title={`${task.dueAt?.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) ?? ""} ${task.title}`} className={`truncate rounded-md border-l-[3px] px-1.5 py-1 text-[9px] font-medium sm:text-[10px] ${task.completed ? "bg-[#f0f1f4] text-[#818393] line-through" : "bg-[#ecebff] text-[#4c46c5]"}`} style={{ borderLeftColor: calendar?.color ?? "#625cf0" }}>{task.dueAt?.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} {task.title}</div>; })}{events.length > 2 && <p className="px-1 text-[9px] font-semibold text-[#77798b]">+ ещё {events.length - 2}</p>}</div></div>; })}</div>
      </div> : <div className="overflow-x-auto p-3 sm:p-5"><div className="min-w-[340px]" style={{ minWidth: view === "week" ? 820 : view === "three" ? 480 : 320 }}>
        <div className="grid border-l border-t border-[#d9dbe6]" style={{ gridTemplateColumns: `48px repeat(${days.length}, minmax(0, 1fr))` }}><div className="border-b border-r border-[#d9dbe6] bg-[#f3f4fa]"/>{days.map((day) => { const date = dayKey(day); const isToday = date === today; return <div key={date} className={`flex items-center justify-between border-b border-r border-[#d9dbe6] px-2 py-2.5 ${isToday ? "bg-[#eeedff]" : "bg-[#f8f8fc]"}`}><div><p className={`text-[9px] font-bold uppercase ${isToday ? "text-[#514be0]" : "text-[#7c7e91]"}`}>{new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(day)}</p><p className={`mt-0.5 text-sm font-semibold ${isToday ? "text-[#514be0]" : "text-[#35374a]"}`}>{day.getDate()} <span className="text-[9px] font-medium text-[#85879a]">{new Intl.DateTimeFormat("ru-RU", { month: "short" }).format(day)}</span></p></div><Link aria-label={`Добавить задачу на ${day.toLocaleDateString("ru-RU")}`} href={taskHref(day)} className="grid h-6 w-6 place-items-center rounded-lg text-sm text-[#85879a] hover:bg-white hover:text-[#514be0]"><Plus aria-hidden="true" size={14}/></Link></div>; })}{hours.map((hour) => <div key={`hour-${hour}`} className="contents"><div className="h-12 border-b border-r border-[#d9dbe6] bg-[#f8f8fc] pr-2 pt-1 text-right text-[9px] font-medium tabular-nums text-[#85879a]">{pad(hour)}:00</div>{days.map((day) => { const dayId = dayKey(day); const dayEvents = (eventsByDay.get(dayId) ?? []).filter((task) => task.dueAt?.getHours() === hour); return <div key={`${dayId}-${hour}`} className={`min-h-12 border-b border-r border-[#d9dbe6] p-1 ${dayId === today ? "bg-[#fbfaff]" : "bg-white"}`}>{dayEvents.slice(0, 2).map((task) => { const calendar = calendarList.find((item) => item.id === task.calendarId); return <div key={task.id} title={task.title} className={`mb-1 truncate rounded-md border-l-[3px] px-1.5 py-1 text-[9px] font-medium leading-3 ${task.completed ? "bg-[#f0f1f4] text-[#818393] line-through" : "bg-[#ecebff] text-[#4c46c5]"}`} style={{ borderLeftColor: calendar?.color ?? "#625cf0" }}>{task.dueAt?.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} {task.title}</div>; })}{dayEvents.length > 2 && <p className="text-[8px] font-semibold text-[#77798b]">ещё {dayEvents.length - 2}</p>}</div>; })}</div>)}</div>
      </div></div>}
      <p className="border-t border-[#e9e9f0] px-4 py-3 text-[10px] text-[#85879a]">Задачи со сроком отображаются по времени. Используйте кнопку добавления, чтобы создать задачу на выбранный день.</p>
    </section>

    <section className="mt-6 rounded-2xl border border-[#e9e9f0] bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold">Мои календари</h2><p className="mt-1 text-xs text-[#999baa]">Назначайте их задачам для тематической группировки.</p></div></div><div className="mt-4"><Modal title="Новый календарь" description="Создайте цветную категорию, чтобы группировать задачи." trigger="＋ Добавить календарь"><form action={createCalendar} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"><label className="flex-1 text-xs font-medium text-[#656779]">Название<input required maxLength={80} name="name" placeholder="Например, Учёба" className="mt-2 block w-full rounded-xl border border-[#e7e7ee] px-4 py-3 text-sm font-normal outline-none focus:border-[#817beb]"/></label><label className="text-xs font-medium text-[#656779]">Цвет<input type="color" name="color" defaultValue="#625cf0" className="mt-2 block h-11 w-16 cursor-pointer rounded-lg border border-[#e7e7ee] bg-white p-1"/></label><button className="rounded-xl bg-[#625cf0] px-4 py-3 text-sm font-semibold text-white hover:bg-[#514be0]">Создать</button></form></Modal></div>{params.error === "duplicate" && <p className="mt-3 text-xs text-red-600">Такой календарь уже создан.</p>}{params.error === "invalid" && <p className="mt-3 text-xs text-red-600">Проверьте название календаря.</p>}{params.created && <p className="mt-3 text-xs text-emerald-700">Календарь создан.</p>}
      <div className="mt-4 flex flex-wrap gap-2">{calendarList.map((calendar) => <div key={calendar.id} className="flex items-center gap-2 rounded-full border border-[#ececf2] px-3 py-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: calendar.color }}/><span className="text-xs text-[#5f6171]">{calendar.name}</span><ConfirmAction title="Удалить календарь" description="Календарь будет удалён. Связанные задачи сохранятся без календаря." action={deleteCalendar} fields={{ id: calendar.id }}/></div>)}{calendarList.length === 0 && <p className="text-xs text-[#999baa]">Создайте календарь, затем назначьте его задаче.</p>}</div>
    </section>
  </ModuleShell>;
}
