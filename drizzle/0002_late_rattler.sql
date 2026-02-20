CREATE TABLE `carpool_spots` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`mentor_id` text NOT NULL,
	`capacity` integer NOT NULL,
	`driver_name` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`mentor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `event_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`event_id` text NOT NULL,
	`paid` integer DEFAULT false NOT NULL,
	`form_completed` integer DEFAULT false NOT NULL,
	`invoice_id` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`userid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hotel_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`room_name` text NOT NULL,
	`gender` text,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `magic_codes` (
	`email` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `room_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`student_id` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `hotel_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`userid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `students` ADD `parent_emails` text;--> statement-breakpoint
ALTER TABLE `students` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `students` ADD `parent_phone` text;--> statement-breakpoint
ALTER TABLE `students` ADD `dietary_restrictions` text;--> statement-breakpoint
ALTER TABLE `students` ADD `custom_fields` text;--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `data`;