CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contacts_email_unique` ON `contacts` (`email`);
