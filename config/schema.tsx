import { integer, json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits: integer().notNull().default(0),
});

export const sessionChatTable = pgTable("session_chat", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  sessionId: varchar("session_id", { length: 255 }).notNull(),

  note: text(),
  selectedDoctor: json("selectedDoctor"),
  conversation: json(),   
  report: json(),

  createdBy: varchar("created_by", { length: 255 })
    .notNull()
    .references(() => usersTable.email),

  createdOn: varchar("created_on", { length: 255 }).notNull(),
});

export const followUpsTable = pgTable("follow_ups", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  consultationId: integer("consultation_id")
    .notNull()
    .references(() => sessionChatTable.id),
  userEmail: varchar("user_email", { length: 255 })
    .notNull()
    .references(() => usersTable.email),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  reason: text().notNull(),
  status: varchar({ length: 32 }).notNull().default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});