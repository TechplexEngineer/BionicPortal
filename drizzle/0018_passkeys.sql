CREATE TABLE `passkey` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`public_key` text NOT NULL,
	`counter` integer NOT NULL,
	`transports` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `passkey_user_id_idx` ON `passkey` (`user_id`);
--> statement-breakpoint
CREATE TABLE `passkey_challenge` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge` text NOT NULL,
	`ceremony` text NOT NULL,
	`user_id` text,
	`expires_at` integer NOT NULL
);
