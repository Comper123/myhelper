"use client";

import { Modal } from "./Modal";
import { Trash2 } from "lucide-react";

type Props = { title: string; description: string; action: (formData: FormData) => void | Promise<void>; fields: Record<string, string>; trigger?: string; confirmText?: string };

export function ConfirmAction({ title, description, action, fields, trigger = "Удалить", confirmText = "Удалить" }: Props) {
  return <Modal title={title} description={description} trigger={<><Trash2 aria-hidden="true" size={15} strokeWidth={1.8}/><span className="sr-only">{trigger}</span></>} triggerClassName="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#a0a1ae] transition hover:bg-red-50 hover:text-red-600" >
    <form action={action} className="flex items-center justify-end gap-2"><input type="hidden" name="__confirm" value="1"/>{Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>)}<button type="submit" className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">{confirmText}</button></form>
  </Modal>;
}
