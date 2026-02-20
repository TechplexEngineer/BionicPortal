import { sqliteTable, integer, text, unique } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';
import { z } from 'zod';

// ----------------------------------------------------------------------------
// Users table
// ----------------------------------------------------------------------------
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: text("role").notNull().default("user")
});
export type User = typeof user.$inferSelect;

// ----------------------------------------------------------------------------
// Login Sessions Table
// ----------------------------------------------------------------------------
export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull()
});
export type Session = typeof session.$inferSelect;

// ----------------------------------------------------------------------------
// Students Table
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Attendance Table
// ----------------------------------------------------------------------------

export const attendance = sqliteTable(
	"attendance",
	{
		userid: text("userid")
			.notNull()
			.references(() => students.userid), // foreign key to students.userid
		timestamp: integer("timestamp", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`) // unix timestamp
	}
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

// ----------------------------------------------------------------------------
// Competition Events Table
// ----------------------------------------------------------------------------
export interface EventData {
	name: string;
	startDate: string; // ISO string
	endDate: string;   // ISO string
	location: string;
	description?: string;
	hotelAddress?: string;
}

export const events = sqliteTable("events", {
	id: text("id").primaryKey(),
	data: text("data").$type<EventData>()
});
export type Events = typeof events.$inferSelect;
export const eventInsertSchema = createInsertSchema(events, {
	data: z.object({
		name: z.string().min(1),
		startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
			message: "Invalid date format"
		}),
		endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
			message: "Invalid date format"
		}),
		location: z.string().min(1),
		description: z.string().optional(),
		hotelAddress: z.string().optional()
	})
});
export type EventInsert = z.infer<typeof eventInsertSchema>;