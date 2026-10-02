"use server";

import { and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/db";
import { calendars, financialCategories, financialTransactions, habitEntries, habits, noteFolders, notes } from "@/db/schema";
import { habitPeriodStart, isHabitFrequency } from "@/lib/habit-periods";

async function userId() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect("/auth/login");
  return session.user.id;
}
function value(form: FormData, key: string) { const result = form.get(key); return typeof result === "string" ? result.trim() : ""; }
function idIsValid(id: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id); }
function refresh(path: string) { revalidatePath("/app"); revalidatePath(path); }

export async function createCalendar(form: FormData) {
  const ownerId = await userId(); const name = value(form, "name"); const color = value(form, "color");
  if (name.length < 1 || name.length > 80 || !/^#[\da-f]{6}$/i.test(color)) redirect("/app/calendars?error=invalid");
  try { await db.insert(calendars).values({ userId: ownerId, name, color }); }
  catch (error) { if (typeof error === "object" && error && "code" in error && error.code === "23505") redirect("/app/calendars?error=duplicate"); throw error; }
  refresh("/app/calendars"); redirect("/app/calendars?created=1");
}
export async function deleteCalendar(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id");
  if (!idIsValid(id)) redirect("/app/calendars?error=invalid");
  await db.delete(calendars).where(and(eq(calendars.id, id), eq(calendars.userId, ownerId)));
  refresh("/app/calendars");
}
export async function createHabit(form: FormData) {
  const ownerId = await userId(); const title = value(form, "title"); const frequency = value(form, "frequency");
  if (title.length < 1 || title.length > 160 || !isHabitFrequency(frequency)) redirect("/app/habits?error=invalid");
  await db.insert(habits).values({ userId: ownerId, title, frequency });
  refresh("/app/habits"); redirect("/app/habits?created=1");
}
export async function updateHabit(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id"); const title = value(form, "title"); const frequency = value(form, "frequency");
  if (!idIsValid(id) || title.length < 1 || title.length > 160 || !isHabitFrequency(frequency)) redirect("/app/habits?error=invalid");
  await db.update(habits).set({ title, frequency }).where(and(eq(habits.id, id), eq(habits.userId, ownerId)));
  refresh("/app/habits");
}
export async function toggleHabit(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id"); const checked = value(form, "checked") === "true";
  if (!idIsValid(id)) redirect("/app/habits?error=invalid");
  const today = new Date().toISOString().slice(0, 10);
  const [habit] = await db.select({ id: habits.id, frequency: habits.frequency }).from(habits).where(and(eq(habits.id, id), eq(habits.userId, ownerId))).limit(1);
  if (!habit) redirect("/app/habits?error=invalid");
  const periodStart = habitPeriodStart(habit.frequency, today);
  if (checked) {
    const [existing] = await db.select({ id: habitEntries.id }).from(habitEntries).where(and(eq(habitEntries.habitId, id), eq(habitEntries.userId, ownerId), gte(habitEntries.checkedOn, periodStart), lte(habitEntries.checkedOn, today))).limit(1);
    if (!existing) await db.insert(habitEntries).values({ userId: ownerId, habitId: id, checkedOn: today }).onConflictDoNothing();
  } else {
    await db.delete(habitEntries).where(and(eq(habitEntries.habitId, id), eq(habitEntries.userId, ownerId), gte(habitEntries.checkedOn, periodStart), lte(habitEntries.checkedOn, today)));
  }
  refresh("/app/habits");
}
export async function deleteHabit(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id");
  if (!idIsValid(id)) redirect("/app/habits?error=invalid");
  await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, ownerId)));
  refresh("/app/habits");
}
export async function toggleHabitPin(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id");
  if (!idIsValid(id)) redirect("/app/habits?error=invalid");
  const [habit] = await db.select({ isPinned: habits.isPinned }).from(habits).where(and(eq(habits.id, id), eq(habits.userId, ownerId))).limit(1);
  if (!habit) redirect("/app/habits?error=invalid");
  await db.update(habits).set({ isPinned: !habit.isPinned }).where(and(eq(habits.id, id), eq(habits.userId, ownerId)));
  refresh("/app/habits");
}
export async function createTransaction(form: FormData) {
  const ownerId = await userId(); const type = value(form, "type"); const amount = value(form, "amount");
  const categoryId = value(form, "categoryId"); const description = value(form, "description"); const occurredAt = value(form, "occurredAt");
  if (!["income", "expense"].includes(type) || !/^\d{1,10}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0 || !idIsValid(categoryId) || description.length > 240 || !/^\d{4}-\d{2}-\d{2}$/.test(occurredAt)) redirect("/app/finance?error=invalid");
  const transactionType = type as "income" | "expense";
  const [category] = await db.select({ name: financialCategories.name }).from(financialCategories).where(and(eq(financialCategories.id, categoryId), eq(financialCategories.userId, ownerId), eq(financialCategories.type, transactionType))).limit(1);
  if (!category) redirect("/app/finance?error=category");
  await db.insert(financialTransactions).values({ userId: ownerId, type, amount, category: category.name, description: description || null, occurredAt });
  refresh("/app/finance"); redirect("/app/finance?created=1");
}
export async function deleteTransaction(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id");
  if (!idIsValid(id)) redirect("/app/finance?error=invalid");
  await db.delete(financialTransactions).where(and(eq(financialTransactions.id, id), eq(financialTransactions.userId, ownerId)));
  refresh("/app/finance");
}
export async function createFinancialCategory(form: FormData) {
  const ownerId = await userId(); const name = value(form, "name"); const type = value(form, "type"); const color = value(form, "color");
  if (name.length < 1 || name.length > 80 || !["income", "expense"].includes(type) || !/^#[\da-f]{6}$/i.test(color)) redirect("/app/finance?error=category");
  const categoryType = type as "income" | "expense";
  try { await db.insert(financialCategories).values({ userId: ownerId, name, type: categoryType, color }); }
  catch (error) { if (typeof error === "object" && error && "code" in error && error.code === "23505") redirect("/app/finance?error=duplicate-category"); throw error; }
  refresh("/app/finance"); redirect("/app/finance?categoryCreated=1");
}
export async function updateFinancialCategory(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id"); const name = value(form, "name"); const color = value(form, "color");
  if (!idIsValid(id) || name.length < 1 || name.length > 80 || !/^#[\da-f]{6}$/i.test(color)) redirect("/app/finance?error=category");
  const [existing] = await db.select({ name: financialCategories.name, type: financialCategories.type }).from(financialCategories).where(and(eq(financialCategories.id, id), eq(financialCategories.userId, ownerId))).limit(1);
  if (!existing) redirect("/app/finance?error=category");
  try {
    await db.update(financialCategories).set({ name, color }).where(and(eq(financialCategories.id, id), eq(financialCategories.userId, ownerId)));
    if (existing.name !== name) await db.update(financialTransactions).set({ category: name }).where(and(eq(financialTransactions.userId, ownerId), eq(financialTransactions.type, existing.type), eq(financialTransactions.category, existing.name)));
  } catch (error) { if (typeof error === "object" && error && "code" in error && error.code === "23505") redirect("/app/finance?error=duplicate-category"); throw error; }
  refresh("/app/finance"); redirect("/app/finance?categoryUpdated=1");
}
export async function deleteFinancialCategory(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id");
  if (!idIsValid(id)) redirect("/app/finance?error=category");
  await db.delete(financialCategories).where(and(eq(financialCategories.id, id), eq(financialCategories.userId, ownerId)));
  refresh("/app/finance"); redirect("/app/finance?categoryDeleted=1");
}
export async function createFolder(form: FormData) {
  const ownerId = await userId(); const name = value(form, "name");
  if (name.length < 1 || name.length > 80) redirect("/app/notes?error=folder");
  try { await db.insert(noteFolders).values({ userId: ownerId, name }); }
  catch (error) { if (typeof error === "object" && error && "code" in error && error.code === "23505") redirect("/app/notes?error=duplicate-folder"); throw error; }
  refresh("/app/notes"); redirect("/app/notes?folderCreated=1");
}
export async function deleteFolder(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id");
  if (!idIsValid(id)) redirect("/app/notes?error=folder");
  await db.delete(noteFolders).where(and(eq(noteFolders.id, id), eq(noteFolders.userId, ownerId)));
  refresh("/app/notes");
}
export async function createNote(form: FormData) {
  const ownerId = await userId(); const title = value(form, "title"); const content = value(form, "content"); const folderId = value(form, "folderId");
  const tags = value(form, "tags").split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 12);
  if (title.length < 1 || title.length > 200 || content.length > 20_000 || tags.some((tag) => tag.length > 40)) redirect("/app/notes?error=invalid");
  if (folderId && !idIsValid(folderId)) redirect("/app/notes?error=folder");
  if (folderId) { const [folder] = await db.select({ id: noteFolders.id }).from(noteFolders).where(and(eq(noteFolders.id, folderId), eq(noteFolders.userId, ownerId))).limit(1); if (!folder) redirect("/app/notes?error=folder"); }
  await db.insert(notes).values({ userId: ownerId, folderId: folderId || null, title, content, tags });
  refresh("/app/notes"); redirect("/app/notes?created=1");
}
export async function updateNote(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id"); const title = value(form, "title");
  const content = value(form, "content"); const folderId = value(form, "folderId");
  const tags = value(form, "tags").split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 12);
  if (!idIsValid(id) || title.length < 1 || title.length > 200 || content.length > 20_000 || tags.some((tag) => tag.length > 40)) redirect("/app/notes?error=invalid");
  if (folderId && !idIsValid(folderId)) redirect("/app/notes?error=folder");
  if (folderId) { const [folder] = await db.select({ id: noteFolders.id }).from(noteFolders).where(and(eq(noteFolders.id, folderId), eq(noteFolders.userId, ownerId))).limit(1); if (!folder) redirect("/app/notes?error=folder"); }
  await db.update(notes).set({ title, content, folderId: folderId || null, tags, updatedAt: new Date() }).where(and(eq(notes.id, id), eq(notes.userId, ownerId)));
  refresh("/app/notes"); redirect("/app/notes?updated=1");
}
export async function deleteNote(form: FormData) {
  const ownerId = await userId(); const id = value(form, "id");
  if (!idIsValid(id)) redirect("/app/notes?error=invalid");
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, ownerId)));
  refresh("/app/notes");
}


