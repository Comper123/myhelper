import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { Check, LayoutGrid, Pin, PinOff, Sparkles, Plus } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ModuleShell } from "@/components/app/ModuleShell";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Modal } from "@/components/ui/Modal";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { authOptions } from "@/auth";
import { db } from "@/db";
import { habitEntries, habits } from "@/db/schema";
import { habitFrequencyName, habitPeriodName, habitPeriodStart } from "@/lib/habit-periods";
import { HabitHistory } from "./HabitHistory";
import { HabitWeekPreview } from "./HabitWeekPreview";
import { createHabit, deleteHabit, toggleHabit, toggleHabitPin, updateHabit } from "../modules/actions";

type Params = Promise<{ error?: string; created?: string; habit?: string }>;

export default async function HabitsPage({ searchParams }: { searchParams: Params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect("/auth/login");
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const items = await db.select().from(habits).where(eq(habits.userId, session.user.id)).orderBy(desc(habits.isPinned), asc(habits.createdAt));
  const showAll = params.habit === "all";
  const selectedHabit = items.some((habit) => habit.id === params.habit) ? params.habit! : showAll ? "" : items[0]?.id ?? "";
  const visibleItems = showAll || !selectedHabit ? items : items.filter((habit) => habit.id === selectedHabit);
  const entries = items.length ? await db.select().from(habitEntries).where(eq(habitEntries.userId, session.user.id)) : [];
  const doneInPeriod = (habitId: string, frequency: string) => {
    const start = habitPeriodStart(frequency, today);
    return entries.some((entry) => entry.habitId === habitId && entry.checkedOn >= start && entry.checkedOn <= today);
  };
  const frequencyOptions = [
    { value: "daily", label: "Дневная" },
    { value: "weekly", label: "Недельная" },
    { value: "monthly", label: "Месячная" },
  ];

  return <ModuleShell active="Привычки" userLabel={session.user.name ?? session.user.email ?? "Аккаунт"}>
    <header>
      <p className="text-[10px] font-semibold tracking-[.14em] text-[#898b9c]">РЕГУЛЯРНЫЕ ДЕЙСТВИЯ</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em]">Привычки</h1>
      <p className="mt-2 text-sm text-[#858697]">Выберите привычку слева, чтобы посмотреть её выполнение и историю.</p>
    </header>

    <div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-[#d7d4ff] bg-gradient-to-b from-[#faf9ff] to-white p-3 shadow-md shadow-[#625cf0]/[.08] lg:sticky lg:top-6">
        <div className="flex items-center justify-between px-2 py-1">
          <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#858697]">Мои привычки</p>
          <span className="text-[10px] tabular-nums text-[#a1a2b2]">{items.length}</span>
        </div>
        <nav aria-label="Список привычек" className="mt-2 space-y-1">
          <Link href="/app/habits?habit=all" aria-current={showAll ? "page" : undefined} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${showAll ? "bg-gradient-to-r from-[#625cf0] to-[#817beb] text-white shadow-md shadow-[#625cf0]/20" : "text-[#55576c] hover:bg-[#eeedff] hover:text-[#514be0]"}`}>
            <span className="flex items-center gap-2"><LayoutGrid aria-hidden="true" size={15}/>Все привычки</span>
            <span className="text-[10px] opacity-70">{items.length}</span>
          </Link>
          {items.map((habit) => <Link key={habit.id} href={`/app/habits?habit=${habit.id}`} aria-current={!showAll && selectedHabit === habit.id ? "page" : undefined} className={`flex min-w-0 items-start gap-2.5 rounded-xl px-3 py-2.5 transition ${!showAll && selectedHabit === habit.id ? "bg-gradient-to-r from-[#625cf0] to-[#817beb] text-white shadow-md shadow-[#625cf0]/20" : "text-[#55576c] hover:bg-[#eeedff] hover:text-[#514be0]"}`}>
            {habit.isPinned ? <Pin className={`mt-0.5 shrink-0 ${!showAll && selectedHabit === habit.id ? "text-[#ffe87c]" : "text-[#e6a700]"}`} aria-hidden="true" size={14} fill="currentColor"/> : <Sparkles className={`mt-0.5 shrink-0 ${!showAll && selectedHabit === habit.id ? "text-white/80" : "text-[#a19bf7]"}`} aria-hidden="true" size={14}/>}
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{habit.title}</span><span className="mt-1 block text-[10px] opacity-65">{habitFrequencyName(habit.frequency)}</span></span>
          </Link>)}
          {items.length === 0 && <p className="px-3 py-3 text-[11px] leading-5 text-[#999baa]">Добавьте привычку, и она появится здесь.</p>}
        </nav>
        <div className="mt-3 border-t border-[#f0f0f4] pt-3">
          <Modal title="Новая привычка" description="Задайте название и выберите частоту повторения." trigger={<><Plus aria-hidden="true" size={15}/><span>Добавить привычку</span></>} triggerClassName="w-full rounded-xl bg-[#625cf0] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#514be0]">
            <form action={createHabit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1 text-xs font-medium text-[#656779]">Название привычки<input required maxLength={160} name="title" placeholder="Например, читать 20 минут" className="mt-2 block w-full rounded-xl border border-[#e7e7ee] px-4 py-3 text-sm font-normal outline-none focus:border-[#817beb]"/></label>
              <label className="text-xs font-medium text-[#656779]">Тип привычки<CustomSelect name="frequency" className="mt-2 min-w-36" options={frequencyOptions}/></label>
              <button className="rounded-xl bg-[#625cf0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#514be0]">Добавить</button>
            </form>
          </Modal>
        </div>
      </aside>

      <main className="min-w-0">
        {params.error && <p role="alert" className="mb-3 text-sm text-red-600">Проверьте название и тип привычки.</p>}
        {params.created && <p className="mb-3 text-sm text-emerald-700">Привычка добавлена.</p>}
        {visibleItems.length ? <div className="grid min-w-0 gap-4">{visibleItems.map((habit) => {
          const habitEntriesList = entries.filter((entry) => entry.habitId === habit.id);
          const done = doneInPeriod(habit.id, habit.frequency);
          return <article key={habit.id} className={`min-w-0 rounded-2xl border-t-4 bg-gradient-to-br from-white via-white to-[#f5f4ff] p-4 shadow-md shadow-[#39319a]/[.06] transition md:p-5 ${habit.isPinned ? "border-x-[#c7c2ff] border-b-[#c7c2ff] border-t-[#625cf0]" : "border-x-[#e0e0ec] border-b-[#e0e0ec] border-t-[#a5a0f4]"}`}>
            <div className="flex flex-wrap items-center gap-3">
              <form action={toggleHabit}><input type="hidden" name="id" value={habit.id}/><input type="hidden" name="checked" value={String(!done)}/><button aria-label={done ? "Снять отметку за этот период" : "Отметить период выполненным"} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 transition ${done ? "border-[#12a365] bg-[#12a365] text-white shadow-md shadow-emerald-500/25" : "border-[#b7bfce] bg-white text-transparent hover:border-[#625cf0] hover:bg-[#f4f2ff]"}`}>{done && <Check aria-hidden="true" size={18} strokeWidth={2.5}/>}</button></form>
              <div className="min-w-0 flex-1"><h2 className={`truncate text-sm font-semibold ${done ? "text-[#a1a2b2] line-through" : "text-[#333548]"}`}>{habit.title}</h2><p className="mt-1 text-[11px] text-[#999baa]">{habitFrequencyName(habit.frequency)} · {done ? `Выполнено ${habitPeriodName(habit.frequency)}` : `Не отмечено ${habitPeriodName(habit.frequency)}`}</p></div>
              <form action={toggleHabitPin}><input type="hidden" name="id" value={habit.id}/><button aria-label={habit.isPinned ? "Открепить привычку" : "Закрепить привычку"} title={habit.isPinned ? "Открепить" : "Закрепить"} className={`grid h-8 w-8 place-items-center rounded-lg transition ${habit.isPinned ? "bg-[#f0efff] text-[#5e58e8]" : "text-[#b0b1bd] hover:bg-[#f7f7fb] hover:text-[#625cf0]"}`}>{habit.isPinned ? <Pin aria-hidden="true" size={16} fill="currentColor"/> : <PinOff aria-hidden="true" size={16}/>}</button></form>
              <span className={`rounded-full px-3 py-1 text-[10px] font-medium ${done ? "bg-[#edf8f1] text-[#32976d]" : "bg-[#f5f5f8] text-[#858697]"}`}>{done ? "Готово" : "В процессе"}</span>
              <ConfirmAction title="Удалить привычку" description="Привычка и её история выполнения будут удалены." action={deleteHabit} fields={{ id: habit.id }}/>
            </div>
            <HabitWeekPreview frequency={habit.frequency} createdAt={habit.createdAt.toISOString()} entries={habitEntriesList.map((entry) => entry.checkedOn)}/>
            <HabitHistory frequency={habit.frequency} createdAt={habit.createdAt.toISOString()} entries={habitEntriesList.map((entry) => entry.checkedOn)}/>
            <Modal title="Изменить привычку" description="Измените название или период привычки." trigger="Изменить привычку" triggerClassName="mt-3 cursor-pointer text-[11px] font-medium text-[#625cf0] hover:underline">
              <form action={updateHabit} className="flex flex-col gap-2 sm:flex-row"><input type="hidden" name="id" value={habit.id}/><input required maxLength={160} name="title" defaultValue={habit.title} className="min-w-0 flex-1 rounded-lg border border-[#e7e7ee] px-3 py-2 text-xs"/><CustomSelect name="frequency" defaultValue={habit.frequency} options={frequencyOptions}/><button className="rounded-lg bg-[#f0efff] px-3 py-2 text-xs font-medium text-[#5e58e8]">Сохранить</button></form>
            </Modal>
          </article>;
        })}</div> : <div className="rounded-2xl border border-dashed border-[#dcdce7] bg-white px-5 py-12 text-center"><p className="text-sm font-medium">Добавьте первую привычку</p><p className="mt-1 text-xs text-[#999baa]">Выберите дневной, недельный или месячный период.</p></div>}
      </main>
    </div>
  </ModuleShell>;
}
