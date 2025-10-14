CREATE TABLE `attendance` (
	`userid` text NOT NULL,
	`timestamp` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userid`) REFERENCES `students`(`userid`) ON UPDATE no action ON DELETE no action
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
CREATE UNIQUE INDEX `uniqueUserName` ON `students` (`first_name`,`last_name`);