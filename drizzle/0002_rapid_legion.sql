DROP TABLE `teams`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_attends` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`number` integer NOT NULL,
	`event_id` integer,
	`created_at` text,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_attends`("id", "name", "number", "event_id", "created_at") SELECT "id", "name", "number", "event_id", "created_at" FROM `attends`;--> statement-breakpoint
DROP TABLE `attends`;--> statement-breakpoint
ALTER TABLE `__new_attends` RENAME TO `attends`;--> statement-breakpoint
PRAGMA foreign_keys=ON;