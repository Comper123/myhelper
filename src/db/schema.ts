import { sql } from "drizzle-orm";
import type { HabitFrequency } from "../lib/habit-periods";
import { boolean, date, index, numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const calendars = pgTable("calendars", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  color: varchar("color", { length: 7 }).default("#625cf0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("calendars_user_name_unique").on(table.userId, table.name)]);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  calendarId: uuid("calendar_id").references(() => calendars.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("tasks_user_due_idx").on(table.userId, table.dueAt)]);

export const habits = pgTable("habits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  frequency: varchar("frequency", { length: 12 }).$type<HabitFrequency>().default("daily").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const habitEntries = pgTable("habit_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  habitId: uuid("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  checkedOn: date("checked_on", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("habit_entries_once_per_day").on(table.habitId, table.checkedOn), index("habit_entries_user_day_idx").on(table.userId, table.checkedOn)]);

export const financialCategories = pgTable("financial_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 8 }).$type<"income" | "expense">().notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  color: varchar("color", { length: 7 }).default("#625cf0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("financial_categories_user_type_name_unique").on(table.userId, table.type, table.name)]);

export const financialTransactions = pgTable("financial_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 8 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: varchar("description", { length: 240 }),
  occurredAt: date("occurred_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("transactions_user_date_idx").on(table.userId, table.occurredAt)]);

export const noteFolders = pgTable("note_folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 80 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("note_folders_user_name_unique").on(table.userId, table.name)]);

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId: uuid("folder_id").references(() => noteFolders.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").default("").notNull(),
  tags: text("tags").array().default(sql`'{}'::text[]`).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("notes_user_updated_idx").on(table.userId, table.updatedAt)]);

