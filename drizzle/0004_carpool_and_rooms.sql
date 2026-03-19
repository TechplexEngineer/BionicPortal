CREATE TABLE `carpool_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`carpool_spot_id` text NOT NULL,
	`student_id` text NOT NULL,
	FOREIGN KEY (`carpool_spot_id`) REFERENCES `carpool_spots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`userid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `carpool_spots_new` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`mentor_id` text NOT NULL,
	`capacity` integer NOT NULL,
	`driver_name` text NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`mentor_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	UNIQUE(`event_id`, `mentor_id`)
);
--> statement-breakpoint
INSERT INTO `carpool_spots_new` SELECT * FROM `carpool_spots`;
--> statement-breakpoint
DROP TABLE `carpool_spots`;
--> statement-breakpoint
ALTER TABLE `carpool_spots_new` RENAME TO `carpool_spots`;
--> statement-breakpoint
CREATE TABLE `room_assignments_new` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`student_id` text,
	`user_id` text,
	FOREIGN KEY (`room_id`) REFERENCES `hotel_rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`userid`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `room_assignments_new` (id, room_id, student_id) SELECT id, room_id, student_id FROM `room_assignments`;
--> statement-breakpoint
DROP TABLE `room_assignments`;
--> statement-breakpoint
ALTER TABLE `room_assignments_new` RENAME TO `room_assignments`;
