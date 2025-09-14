import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Users table
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});
export type User = typeof user.$inferSelect;

// Login Sessions Table
export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});
export type Session = typeof session.$inferSelect;

// Events table
export const events = sqliteTable('events', {
	id: integer('id').primaryKey(),
	name: text('name'),
	description: text('description'),
});
export type Event = typeof events.$inferSelect;

// Volunteers For table
export const volunteers_for = sqliteTable('volunteers_for', {
	id: integer('id').primaryKey(),
	volunteering_user_id: integer('volunteering_user_id').references(() => user.id),
	event_id: integer('event_id').references(() => events.id),
	created_at: text('created_at'),
});
export type VolunteersFor = typeof volunteers_for.$inferSelect;

// Attends table
export const attends = sqliteTable('attends', {
	id: integer('id').primaryKey(),
	team_name: text('name'),
	team_number: integer('number').notNull(),
	event_id: integer('event_id').references(() => events.id),
	created_at: text('created_at'),
});
export type Attends = typeof attends.$inferSelect;

// Question table
export const question = sqliteTable('question', {
	id: integer('id').primaryKey(),
	config: text('config', { mode: 'json' }),
});
export type Question = typeof question.$inferSelect;

// Team Question Answer table
export const team_question_answer = sqliteTable('team_question_answer', {
	id: integer('id').primaryKey(),
	attends_id: integer('attends_id').references(() => attends.id),
	question_id: integer('question_id').references(() => question.id),
	data: text('data', { mode: 'json' }),
});
export type TeamQuestionAnswer = typeof team_question_answer.$inferSelect;

// Volunteer Question Answer table
export const volunteer_question_answer = sqliteTable('volunteer_question_answer', {
	id: integer('id').primaryKey(),
	volunteers_for_id: integer('volunteers_for_id').references(() => volunteers_for.id),
	question_id: integer('question_id').references(() => question.id),
	data: text('data', { mode: 'json' }),
});
export type VolunteerQuestionAnswer = typeof volunteer_question_answer.$inferSelect;


