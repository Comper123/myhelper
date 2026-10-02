import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, LayoutDashboard, ListTodo, NotebookPen, Sparkles, WalletCards } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";

const links = [
  { label: "Обзор", href: "/app", Icon: LayoutDashboard },
  { label: "Задачи", href: "/app/tasks", Icon: ListTodo },
  { label: "Календари", href: "/app/calendars", Icon: CalendarDays },
  { label: "Привычки", href: "/app/habits", Icon: Sparkles },
  { label: "Финансы", href: "/app/finance", Icon: WalletCards },
  { label: "Заметки", href: "/app/notes", Icon: NotebookPen },
];

export function ModuleShell({ active, userLabel, children }: { active: string; userLabel: string; children: ReactNode }) {
  return <main className="min-h-screen bg-[#f1f2ff] text-[#202137] md:flex">
    <aside className="flex w-full flex-col border-b border-[#e9e9f0] bg-white px-5 py-4 md:min-h-screen md:w-[240px] md:border-b-0 md:border-r md:px-4 md:py-7">
      <Link href="/app" className="flex items-center gap-3 px-2 text-lg font-semibold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#625cf0] text-lg font-bold text-white">m</span>myhelper</Link>
      <p className="mb-3 mt-9 hidden px-3 text-[10px] font-semibold tracking-[.13em] text-[#77798f] md:block">РАБОЧЕЕ ПРОСТРАНСТВО</p>
      <nav className="mt-5 flex gap-2 overflow-x-auto md:mt-0 md:flex-col" aria-label="Основная навигация">{links.map(({ label, href, Icon }) => <Link key={href} href={href} aria-current={active === label ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active === label ? "bg-gradient-to-r from-[#625cf0] to-[#817beb] font-semibold text-white shadow-md shadow-[#625cf0]/25" : "text-[#606277] hover:bg-[#f0efff] hover:text-[#514be0]"}`}><Icon aria-hidden="true" size={18} strokeWidth={1.8}/>{label}</Link>)}</nav>
      <div className="mt-auto hidden items-center justify-between gap-2 border-t border-[#eeeef3] px-2 pt-5 md:flex"><span className="truncate text-xs text-[#747687]">{userLabel}</span><SignOutButton/></div>
    </aside>
    <section className="min-w-0 flex-1"><header className="flex h-[62px] items-center justify-between border-b border-[#e9e9f0] bg-white px-5 md:px-8"><p className="text-xs text-[#858697]">Моё пространство <span className="px-2 text-[#c3c4cd]">/</span> {active}</p><div className="flex items-center gap-3"><span className="max-w-[45%] truncate text-xs text-[#858697] md:hidden">{userLabel}</span><span className="hidden max-w-[45%] truncate text-xs text-[#858697] sm:inline">{userLabel}</span><span className="md:hidden"><SignOutButton/></span></div></header><div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 md:px-8 md:py-9">{children}</div></section>
  </main>;
}
