"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const data = new FormData(event.currentTarget);
    const result = await signIn("credentials", { email: data.get("email"), password: data.get("password"), redirect: false });
    setBusy(false);
    if (result?.error) setError("Не удалось войти. Проверьте email и пароль.");
    else router.push(params.get("callbackUrl") || "/app");
  }
  return <main className="flex min-h-screen bg-[#fbfaf8] text-[#20211f]"><aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-[#625cf0] p-12 text-white lg:flex"><div className="absolute -right-36 -top-20 h-[500px] w-[500px] rounded-full border border-white/10"/><div className="absolute -right-14 -top-5 h-[330px] w-[330px] rounded-full border border-white/10"/><Link href="/" className="relative flex items-center gap-3 text-lg font-semibold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 font-bold">m</span>myhelper</Link><div className="relative max-w-lg"><span className="text-sm text-white/65">Рады снова видеть вас</span><h1 className="mt-4 text-5xl font-semibold leading-[1.08] tracking-[-.05em]">Продолжайте<br/>в своём ритме.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-white/70">Ваши планы, заметки и привычки ждут вас в одном месте.</p></div><p className="relative text-xs text-white/50">Маленькие шаги тоже ведут к большим целям.</p></aside><section className="flex flex-1 items-center justify-center px-6 py-12"><div className="w-full max-w-[400px]"><Link href="/" className="mb-12 inline-flex items-center gap-2 text-sm text-[#85847e] transition hover:text-[#625cf0] lg:hidden"><ArrowLeft aria-hidden="true" size={15}/><span>На главную</span></Link><div className="mb-9"><p className="text-xs font-semibold uppercase tracking-[.15em] text-[#7771e5]">Ваше пространство</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">Войти в аккаунт</h2><p className="mt-2 text-sm text-[#85847e]">Продолжайте с того места, где остановились.</p></div><form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium">Email<input required name="email" type="email" autoComplete="email" placeholder="name@example.com" className="mt-2.5 block w-full rounded-xl border border-[#e8e6e1] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-[#b0aea8] focus:border-[#817beb] focus:ring-4 focus:ring-[#625cf014]"/></label><label className="block text-sm font-medium">Пароль<input required name="password" type="password" autoComplete="current-password" placeholder="Ваш пароль" className="mt-2.5 block w-full rounded-xl border border-[#e8e6e1] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-[#b0aea8] focus:border-[#817beb] focus:ring-4 focus:ring-[#625cf014]"/></label>{error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{params.get("registered") && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{params.get("registered") === "email" ? "Аккаунт создан. Проверьте почту и подтвердите email." : "Аккаунт создан. Теперь можно войти."}</p>}<button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#625cf0] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-[#514be0] disabled:cursor-wait disabled:opacity-70">{busy ? "Входим…" : <>Войти<ArrowRight aria-hidden="true" size={15}/></>}</button></form><p className="mt-7 text-center text-sm text-[#85847e]">Впервые здесь? <Link href="/auth/register" className="font-semibold text-[#625cf0] hover:underline">Создать аккаунт</Link></p><Link href="/" className="mt-10 hidden text-center text-xs text-[#a4a29c] hover:text-[#625cf0] lg:block"><ArrowLeft aria-hidden="true" size={13}/> На главную</Link></div></section></main>;
}


