CREATE TABLE `attendance` (
	`userid` text NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`userid`) REFERENCES `students`(`userid`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniqueUserDate` ON `attendance` (`userid`,`date`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `students` (
	`userid` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`data` text NOT NULL,
	`hidden` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_userid_unique` ON `students` (`userid`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniqueUserName` ON `students` (`first_name`,`last_name`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);