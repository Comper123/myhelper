import type { calendars, tasks } from "@/db/schema";
import { Check, Pencil } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { Modal } from "@/components/ui/Modal";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { deleteTask, toggleTask, updateTask } from "../actions";

type TaskItem = typeof tasks.$inferSelect;
type CalendarItem = typeof calendars.$inferSelect;
function dateInput(date: Date | null) {
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TaskRow({ task, calendarList }: { task: TaskItem; calendarList: CalendarItem[] }) {
  return <article className="border-b border-[#f0f0f4] p-4 last:border-0 md:px-5">
    <div className="flex items-start gap-3 md:items-center"><form action={toggleTask}><input type="hidden" name="id" value={task.id}/><input type="hidden" name="completed" value={String(!task.completed)}/><button aria-label={task.completed ? "Вернуть задачу в активные" : "Отметить выполненной"} className={`mt-0.5 grid h-[19px] w-[19px] place-items-center rounded-md border text-xs transition md:mt-0 ${task.completed ? "border-[#625cf0] bg-[#625cf0] text-white" : "border-[#d9dbe5] text-transparent hover:border-[#625cf0]"}`}>{task.completed && <Check aria-hidden="true" size={13} strokeWidth={2.5}/>}</button></form><div className="min-w-0 flex-1"><h3 className={`text-sm font-medium ${task.completed ? "text-[#a1a2b2] line-through" : "text-[#3a3b4d]"}`}>{task.title}</h3>{task.description && <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#858697]">{task.description}</p>}<p className="mt-1 text-[10px] text-[#a1a2b2]">{task.dueAt ? task.dueAt.toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" }) : "Без срока"}{task.calendarId && ` · ${calendarList.find((calendar) => calendar.id === task.calendarId)?.name ?? "Календарь"}`}</p></div><ConfirmAction title="Удалить задачу" description="Задача будет удалена без возможности восстановления." action={deleteTask} fields={{ id: task.id }}/></div>
    <Modal title="Редактировать задачу" description="Обновите описание, календарь или срок." trigger={<><Pencil aria-hidden="true" size={13}/><span>Редактировать</span></>} triggerClassName="ml-8 mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#625cf0]"><form action={updateTask} className="grid gap-2"><input type="hidden" name="id" value={task.id}/><input required maxLength={200} name="title" defaultValue={task.title} className="rounded-lg border border-[#e7e7ee] px-3 py-2 text-xs"/><textarea maxLength={2000} name="description" defaultValue={task.description ?? ""} rows={2} className="rounded-lg border border-[#e7e7ee] px-3 py-2 text-xs"/><div className="grid gap-2 sm:grid-cols-3"><CustomSelect name="calendarId" defaultValue={task.calendarId ?? ""} options={[{ value: "", label: "Без календаря" }, ...calendarList.map((calendar) => ({ value: calendar.id, label: calendar.name, color: calendar.color }))]}/><DateTimePicker name="dueAt" mode="datetime" defaultValue={dateInput(task.dueAt)} placeholder="Дата и время"/><button className="rounded-lg bg-[#f0efff] px-3 py-2 text-xs font-medium text-[#5e58e8]">Сохранить</button></div></form></Modal>
  </article>;
}
