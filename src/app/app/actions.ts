"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/db";
import { calendars, tasks } from "@/db/schema";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect("/auth/login");
  return session.user.id;
}
function validTaskId(value: FormDataEntryValue | null): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function createTask(formData: FormData) {
  const userId = await requireUserId();
  const title = formData.get("title");
  const description = formData.get("description");
  const dueAtValue = formData.get("dueAt");
  const calendarId = formData.get("calendarId");
  if (typeof title !== "string" || title.trim().length < 1 || title.trim().length > 200) redirect("/app/tasks?error=title");
  if (description !== null && (typeof description !== "string" || description.length > 2_000)) redirect("/app/tasks?error=description");
  if (calendarId !== null && typeof calendarId !== "string") redirect("/app/tasks?error=calendar");
  if (calendarId && !validTaskId(calendarId)) redirect("/app/tasks?error=calendar");
  if (calendarId) {
    const [calendar] = await db.select({ id: calendars.id }).from(calendars).where(and(eq(calendars.id, calendarId), eq(calendars.userId, userId))).limit(1);
    if (!calendar) redirect("/app/tasks?error=calendar");
  }
  let dueAt: Date | null = null;
  if (typeof dueAtValue === "string" && dueAtValue.trim()) {
    dueAt = new Date(dueAtValue);
    if (Number.isNaN(dueAt.getTime())) redirect("/app/tasks?error=date");
  }
  await db.insert(tasks).values({ userId, calendarId: calendarId || null, title: title.trim(), description: typeof description === "string" ? description.trim() || null : null, dueAt });
  revalidatePath("/app"); revalidatePath("/app/tasks"); revalidatePath("/app/calendars");
  redirect("/app/tasks?created=1");
}

export async function toggleTask(formData: FormData) {
  const userId = await requireUserId(); const id = formData.get("id"); const completed = formData.get("completed") === "true";
  if (!validTaskId(id)) redirect("/app/tasks?error=task");
  await db.update(tasks).set({ completed, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  revalidatePath("/app"); revalidatePath("/app/tasks"); revalidatePath("/app/calendars");
}

export async function scheduleTask(formData: FormData) {
  const userId = await requireUserId();
  const id = formData.get("id");
  const dateValue = formData.get("date");
  const calendarId = formData.get("calendarId");
  const week = formData.get("week");
  if (!validTaskId(id)) redirect("/app/tasks?view=plan&error=task");
  if (typeof dateValue !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || new Date(`${dateValue}T12:00:00`).toISOString().slice(0, 10) !== dateValue) redirect("/app/tasks?view=plan&error=date");
  if (calendarId !== null && typeof calendarId !== "string") redirect("/app/tasks?view=plan&error=calendar");
  if (calendarId && !validTaskId(calendarId)) redirect("/app/tasks?view=plan&error=calendar");
  if (calendarId) {
    const [calendar] = await db.select({ id: calendars.id }).from(calendars).where(and(eq(calendars.id, calendarId), eq(calendars.userId, userId))).limit(1);
    if (!calendar) redirect("/app/tasks?view=plan&error=calendar");
  }
  await db.update(tasks).set({ dueAt: new Date(`${dateValue}T09:00:00`), calendarId: calendarId || null, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.userId, userId), eq(tasks.completed, false)));
  revalidatePath("/app"); revalidatePath("/app/tasks"); revalidatePath("/app/calendars");
  const weekQuery = typeof week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(week) ? `&week=${week}` : "";
  redirect(`/app/tasks?view=plan${weekQuery}&scheduled=1`);
}

export async function deleteTask(formData: FormData) {
  const userId = await requireUserId(); const id = formData.get("id");
  if (!validTaskId(id)) redirect("/app/tasks?error=task");
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  revalidatePath("/app"); revalidatePath("/app/tasks"); revalidatePath("/app/calendars");
}

export async function updateTask(formData: FormData) {
  const userId = await requireUserId();
  const id = formData.get("id"); const title = formData.get("title");
  const description = formData.get("description"); const dueAtValue = formData.get("dueAt"); const calendarId = formData.get("calendarId");
  if (!validTaskId(id)) redirect("/app/tasks?error=task");
  if (typeof title !== "string" || title.trim().length < 1 || title.trim().length > 200) redirect("/app/tasks?error=title");
  if (typeof description !== "string" || description.length > 2_000) redirect("/app/tasks?error=description");
  if (calendarId !== null && typeof calendarId !== "string") redirect("/app/tasks?error=calendar");
  if (calendarId && !validTaskId(calendarId)) redirect("/app/tasks?error=calendar");
  if (calendarId) {
    const [calendar] = await db.select({ id: calendars.id }).from(calendars).where(and(eq(calendars.id, calendarId), eq(calendars.userId, userId))).limit(1);
    if (!calendar) redirect("/app/tasks?error=calendar");
  }
  let dueAt: Date | null = null;
  if (typeof dueAtValue === "string" && dueAtValue.trim()) {
    dueAt = new Date(dueAtValue);
    if (Number.isNaN(dueAt.getTime())) redirect("/app/tasks?error=date");
  }
  await db.update(tasks).set({ title: title.trim(), description: description.trim() || null, dueAt, calendarId: calendarId || null, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  revalidatePath("/app"); revalidatePath("/app/tasks"); revalidatePath("/app/calendars");
}
