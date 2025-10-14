import { sqliteTable, integer, text, unique } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/gel-core";

// Users table
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: text("role").notNull().default("user")
});
export type User = typeof user.$inferSelect;

// Login Sessions Table
export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull()
});
export type Session = typeof session.$inferSelect;

export const students = sqliteTable(
	"students",
	{
		userid: text("userid").notNull().unique(), //@billericak12.com email
		firstName: text("first_name").notNull(),
		lastName: text("last_name").notNull(),
		data: text("data").notNull(), // future expansion
		hidden: integer("hidden", { mode: "boolean" }).notNull().default(false) // 0=false 1=true
	},
	(table) => [unique("uniqueUserName").on(table.firstName, table.lastName)]
);
export type Student = typeof students.$inferSelect;

export const attendance = sqliteTable(
	"attendance",
	{
		userid: text("userid")
			.notNull()
			.references(() => students.userid), // foreign key to students.userid
		date: text("date").notNull(), // deprecated, use timestamp instead
		timestamp: integer("timestamp", { mode: "timestamp" }).notNull().default(sql`(strftime('%s','now'))`) // unix timestamp
	},
	(table) => [unique("uniqueUserDate").on(table.userid, table.date)]
);
export type Attendance = typeof attendance.$inferSelect;

export const studentsRelations = relations(students, ({ many }) => ({
	attendance: many(attendance)
}));

// Attendance to Students relation

export const attendanceRelations = relations(attendance, ({ one }) => ({
	student: one(students, {
		fields: [attendance.userid],
		references: [students.userid]
	})
}));
