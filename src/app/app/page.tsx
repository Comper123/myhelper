import Link from "next/link";
import { CalendarDays, Check, ChevronRight, ListTodo, NotebookPen, Plus, Sparkles, WalletCards } from "lucide-react";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ModuleShell } from "@/components/app/ModuleShell";
import { authOptions } from "@/auth";
import { db } from "@/db";
import { financialTransactions, habitEntries, habits, notes, tasks } from "@/db/schema";
import { habitPeriodStart } from "@/lib/habit-periods";
import { toggleTask } from "./actions";

const money = (amount: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(amount);

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect("/auth/login");
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const monthStart = `${now.toISOString().slice(0, 7)}-01`;
  const today = now.toISOString().slice(0, 10);
  const [allTasks, todayTasks, userHabits, transactions, userNotes] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.userId, session.user.id)).orderBy(asc(tasks.dueAt), asc(tasks.createdAt)),
    db.select().from(tasks).where(and(eq(tasks.userId, session.user.id), gte(tasks.dueAt, startOfDay), lt(tasks.dueAt, startOfTomorrow))).orderBy(asc(tasks.dueAt)),
    db.select().from(habits).where(eq(habits.userId, session.user.id)),
    db.select().from(financialTransactions).where(and(eq(financialTransactions.userId, session.user.id), gte(financialTransactions.occurredAt, monthStart))),
    db.select({ id: notes.id }).from(notes).where(eq(notes.userId, session.user.id)),
  ]);
  const earliestHabitPeriod = userHabits.map((habit) => habitPeriodStart(habit.frequency, today)).sort()[0];
  const habitLogs = earliestHabitPeriod ? await db.select().from(habitEntries).where(and(eq(habitEntries.userId, session.user.id), gte(habitEntries.checkedOn, earliestHabitPeriod))) : [];
  const checkedCount = userHabits.filter((habit) => {
    const periodStart = habitPeriodStart(habit.frequency, today);
    return habitLogs.some((entry) => entry.habitId === habit.id && entry.checkedOn >= periodStart && entry.checkedOn <= today);
  }).length;
  const openTasks = allTasks.filter((task) => !task.completed);
  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const name = session.user.name?.split(" ")[0] ?? "";
  const nextTasks = openTasks.slice(0, 5);
  return <ModuleShell active="Обзор" userLabel={session.user.name ?? session.user.email ?? "Аккаунт"}>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[10px] font-semibold tracking-[.14em] text-[#898b9c]">{now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }).toLocaleUpperCase("ru-RU")}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em]">{name ? `Привет, ${name}` : "Ваш обзор"}</h1><p className="mt-2 text-sm text-[#858697]">Сводка по вашим данным.</p></div><Link href="/app/tasks#new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#625cf0] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-[#514be0]"><Plus aria-hidden="true" size={17}/>Новая задача</Link></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Link href="/app/tasks" className="rounded-2xl border border-[#e9e9f0] bg-white p-5 transition hover:border-[#c9c5ff]"><div className="flex items-center justify-between text-xs text-[#858697]">Задачи сегодня<ListTodo aria-hidden="true" size={17} className="text-[#625cf0]"/></div><p className="mt-2 text-3xl font-semibold">{todayTasks.filter((task) => !task.completed).length}<span className="ml-1 text-base font-normal text-[#a1a2b2]">/ {todayTasks.length}</span></p><p className="mt-1 text-[11px] text-[#a1a2b2]">{todayTasks.filter((task) => task.completed).length} выполнено</p></Link>
      <Link href="/app/habits" className="rounded-2xl border border-[#e9e9f0] bg-white p-5 transition hover:border-[#c9c5ff]"><div className="flex items-center justify-between text-xs text-[#858697]">Привычки в периоде<Sparkles aria-hidden="true" size={17} className="text-[#48a879]"/></div><p className="mt-2 text-3xl font-semibold">{checkedCount}<span className="ml-1 text-base font-normal text-[#a1a2b2]">/ {userHabits.length}</span></p><p className="mt-1 text-[11px] text-[#a1a2b2]">Выполнено в текущем периоде</p></Link>
      <Link href="/app/finance" className="rounded-2xl border border-[#e9e9f0] bg-white p-5 transition hover:border-[#c9c5ff]"><div className="flex items-center justify-between text-xs text-[#858697]">Баланс за месяц<WalletCards aria-hidden="true" size={17} className="text-[#4d91dc]"/></div><p className="mt-2 text-2xl font-semibold">{money(income - expenses)}</p><p className="mt-1 text-[11px] text-[#a1a2b2]">Доходы минус расходы</p></Link>
      <Link href="/app/notes" className="rounded-2xl border border-[#e9e9f0] bg-white p-5 transition hover:border-[#c9c5ff]"><div className="flex items-center justify-between text-xs text-[#858697]">Заметки<NotebookPen aria-hidden="true" size={17} className="text-[#e79753]"/></div><p className="mt-2 text-3xl font-semibold">{userNotes.length}</p><p className="mt-1 text-[11px] text-[#a1a2b2]">В вашем пространстве</p></Link>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-2xl border border-[#e9e9f0] bg-white p-5 md:p-6"><div className="flex items-start justify-between"><div><h2 className="text-base font-semibold">Ближайшие задачи</h2><p className="mt-1 text-xs text-[#999baa]">Сохранено в вашем аккаунте</p></div><Link href="/app/tasks" className="inline-flex items-center gap-1 text-xs font-medium text-[#625cf0] hover:underline">Все задачи<ChevronRight aria-hidden="true" size={14}/></Link></div>{nextTasks.length ? <div className="mt-4 divide-y divide-[#f0f0f4]">{nextTasks.map((task) => <div key={task.id} className="flex items-center gap-3 py-3"><form action={toggleTask}><input type="hidden" name="id" value={task.id}/><input type="hidden" name="completed" value="true"/><button aria-label="Отметить выполненной" className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border border-[#d9dbe5] text-transparent hover:border-[#625cf0] hover:text-[#625cf0]"><Check aria-hidden="true" size={12}/></button></form><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{task.title}</p><p className="mt-1 text-[10px] text-[#a1a2b2]">{task.dueAt ? task.dueAt.toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" }) : "Без срока"}</p></div></div>)}</div> : <div className="mt-5 rounded-xl bg-[#fafafd] px-4 py-7 text-center"><p className="text-sm font-medium">Пока нет открытых задач</p><p className="mt-1 text-xs text-[#999baa]">Добавьте первую — она появится здесь.</p><Link href="/app/tasks#new" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#625cf0]">Создать задачу<ChevronRight aria-hidden="true" size={14}/></Link></div>}</section>
      <section className="rounded-2xl border border-[#e9e9f0] bg-white p-5 md:p-6"><h2 className="text-base font-semibold">Быстрый переход</h2><p className="mt-1 text-xs text-[#999baa]">Ваши личные инструменты.</p><div className="mt-4 grid grid-cols-2 gap-3">{[{ label: "Календари", href: "/app/calendars", Icon: CalendarDays }, { label: "Привычки", href: "/app/habits", Icon: Sparkles }, { label: "Финансы", href: "/app/finance", Icon: WalletCards }, { label: "Заметки", href: "/app/notes", Icon: NotebookPen }].map(({ label, href, Icon }) => <Link key={href} href={href} className="flex items-center gap-2 rounded-xl border border-[#f0f0f4] p-3 text-xs font-medium transition hover:border-[#c9c5ff] hover:bg-[#faf9ff]"><Icon aria-hidden="true" size={15} className="text-[#625cf0]"/>{label}</Link>)}</div><p className="mt-4 text-[10px] text-[#a1a2b2]">Активных задач: {openTasks.length} · Записей расходов и доходов: {transactions.length}</p></section>
    </div>
  </ModuleShell>;
}
