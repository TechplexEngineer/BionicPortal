CREATE TABLE `attends` (
	`id` integer PRIMARY KEY NOT NULL,
	`team_id` integer,
	`event_id` integer,
	`created_at` text,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `question` (
	`id` integer PRIMARY KEY NOT NULL,
	`config` text
);
--> statement-breakpoint
CREATE TABLE `team_question_answer` (
	`id` integer PRIMARY KEY NOT NULL,
	`attends_id` integer,
	`question_id` integer,
	`data` text,
	FOREIGN KEY (`attends_id`) REFERENCES `attends`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`number` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `volunteer_question_answer` (
	`id` integer PRIMARY KEY NOT NULL,
	`volunteers_for_id` integer,
	`question_id` integer,
	`data` text,
	FOREIGN KEY (`volunteers_for_id`) REFERENCES `volunteers_for`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `question`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `volunteers_for` (
	`id` integer PRIMARY KEY NOT NULL,
	`volunteering_user_id` integer,
	`event_id` integer,
	`created_at` text,
	FOREIGN KEY (`volunteering_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `age`;