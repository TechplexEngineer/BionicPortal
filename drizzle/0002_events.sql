CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`date_str` text NOT NULL,
	`location` text,
	`smugmug_album_url` text,
	`smugmug_upload_url` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
