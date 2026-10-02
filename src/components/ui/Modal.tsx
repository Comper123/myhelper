"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode, FormEvent } from "react";
import { X } from "lucide-react";

type Props = { title: string; description?: string; trigger: ReactNode; triggerClassName?: string; children: ReactNode; size?: "sm" | "md" | "lg" };

export function Modal({ title, description, trigger, triggerClassName = "", children, size = "md" }: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-xl";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLDialogElement>) {
    const target = event.target;
    if (target instanceof HTMLFormElement && target.checkValidity()) setOpen(false);
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className={triggerClassName || "inline-flex items-center gap-2 rounded-xl bg-[#625cf0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#514be0] focus:outline-none focus:ring-4 focus:ring-[#625cf026]"}>{trigger}</button>
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onClose={() => setOpen(false)} onSubmitCapture={handleSubmit} onClick={(event) => { if (event.target === dialogRef.current) setOpen(false); }} className={`m-auto w-[calc(100%-2rem)] ${width} overflow-visible rounded-2xl border border-[#e9e9f0] bg-white p-0 text-[#252638] shadow-2xl shadow-[#222044]/20 backdrop:bg-[#171526]/35 backdrop:backdrop-blur-[2px]`}>
      <div className="flex items-start justify-between gap-4 border-b border-[#f0f0f4] px-5 py-4 sm:px-6"><div><h2 id={titleId} className="text-base font-semibold tracking-tight">{title}</h2>{description && <p id={descriptionId} className="mt-1 text-xs leading-5 text-[#858697]">{description}</p>}</div><button type="button" aria-label="Закрыть окно" onClick={() => setOpen(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#999baa] transition hover:bg-[#f5f5f8] hover:text-[#525466]"><X aria-hidden="true" size={17}/></button></div>
      <div className="max-h-[min(75vh,42rem)] overflow-y-auto p-5 sm:p-6">{children}</div>
    </dialog>
  </>;
}
