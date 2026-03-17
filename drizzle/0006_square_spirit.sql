CREATE TABLE `parent_student_links` (
	`parent_id` text NOT NULL,
	`student_id` text NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`userid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parent_student_unique` ON `parent_student_links` (`parent_id`,`student_id`);