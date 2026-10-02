import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { financialCategories, users } from "@/db/schema";

const starterCategories = [
  { type: "expense", name: "Продукты", color: "#f97316" },
  { type: "expense", name: "Жильё", color: "#8b5cf6" },
  { type: "expense", name: "Транспорт", color: "#06b6d4" },
  { type: "expense", name: "Здоровье", color: "#ec4899" },
  { type: "expense", name: "Подписки", color: "#6366f1" },
  { type: "expense", name: "Развлечения", color: "#eab308" },
  { type: "expense", name: "Покупки", color: "#14b8a6" },
  { type: "expense", name: "Другое", color: "#64748b" },
  { type: "income", name: "Зарплата", color: "#22c55e" },
  { type: "income", name: "Фриланс", color: "#0ea5e9" },
  { type: "income", name: "Подарки", color: "#d946ef" },
  { type: "income", name: "Другое", color: "#64748b" },
] as const;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать данные формы." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Некорректные данные формы." }, { status: 400 });
  }

  const { name, email, password } = body as Record<string, unknown>;
  if (
    typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120 ||
    typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || email.length > 320 ||
    typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72
  ) {
    return NextResponse.json({ error: "Проверьте имя, email и пароль (от 8 символов)." }, { status: 400 });
  }

  try {
    const passwordHash = await hash(password, 12);
    await db.transaction(async (tx) => {
      const [user] = await tx.insert(users).values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
      }).returning({ id: users.id });
      await tx.insert(financialCategories).values(starterCategories.map((category) => ({ ...category, userId: user.id })));
    });
    return NextResponse.json({ created: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "Аккаунт с таким email уже существует." }, { status: 409 });
    }
    console.error("Registration failed:", error);
    return NextResponse.json({ error: "Не удалось создать аккаунт. Проверьте подключение к базе данных." }, { status: 503 });
  }
}
