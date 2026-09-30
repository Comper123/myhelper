import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Регистрация пока не настроена. Добавьте параметры Supabase в .env.local." }, { status: 503 });
  if (typeof name !== "string" || name.trim().length < 2 || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Проверьте имя, email и пароль (не менее 8 символов)." }, { status: 400 });
  }
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ email: email.trim(), password, data: { name: name.trim() } }),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) return NextResponse.json({ error: result.msg ?? result.message ?? "Не удалось создать аккаунт. Проверьте данные и попробуйте снова." }, { status: response.status });
  return NextResponse.json({ needsEmailConfirmation: !result.session });
}
