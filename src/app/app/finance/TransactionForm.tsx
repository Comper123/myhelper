"use client";

import { useState } from "react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { DateTimePicker } from "@/components/ui/DateTimePicker";

type Category = { id: string; name: string; type: "income" | "expense"; color: string };
type Props = { action: (formData: FormData) => void | Promise<void>; categories: Category[]; defaultDate: string };

export function TransactionForm({ action, categories, defaultDate }: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const options = categories.filter((category) => category.type === type);
  return <form action={action} className="grid gap-4 sm:grid-cols-2">
    <label className="text-xs font-semibold text-[#525466]">Тип операции<CustomSelect name="type" className="mt-2" defaultValue="expense" onValueChange={(value) => setType(value as "income" | "expense")} options={[{ value: "expense", label: "Расход" }, { value: "income", label: "Доход" }]}/></label>
    <label className="text-xs font-semibold text-[#525466]">Сумма<input required type="number" min="0.01" step="0.01" name="amount" placeholder="0,00" className="mt-2 block w-full rounded-xl border border-[#e1e3ec] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#7770f2] focus:ring-4 focus:ring-[#625cf018]"/></label>
    <label className="text-xs font-semibold text-[#525466]">Категория<CustomSelect key={type} name="categoryId" className="mt-2" placeholder={options.length ? "Выберите категорию" : "Сначала создайте категорию"} options={options.map((category) => ({ value: category.id, label: category.name, color: category.color }))}/></label>
    <label className="text-xs font-semibold text-[#525466]">Дата<DateTimePicker name="occurredAt" mode="date" required defaultValue={defaultDate} className="mt-2"/></label>
    <label className="text-xs font-semibold text-[#525466] sm:col-span-2">Комментарий<input maxLength={240} name="description" placeholder="Например, ежемесячная подписка" className="mt-2 block w-full rounded-xl border border-[#e1e3ec] bg-white px-3 py-3 text-sm font-normal outline-none transition focus:border-[#7770f2] focus:ring-4 focus:ring-[#625cf018]"/></label>
    {!options.length && <p className="text-xs font-medium text-amber-700 sm:col-span-2">Для этого типа операций пока нет категорий. Добавьте их в разделе «Категории».</p>}
    <button className="rounded-xl bg-gradient-to-r from-[#625cf0] to-[#817beb] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-[#625cf0]/15 transition hover:brightness-105 sm:col-span-2">Сохранить операцию</button>
  </form>;
}
