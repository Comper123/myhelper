"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[#858697] transition hover:bg-red-50 hover:text-red-600"><LogOut aria-hidden="true" size={15} strokeWidth={1.8}/>Выйти</button>;
}
