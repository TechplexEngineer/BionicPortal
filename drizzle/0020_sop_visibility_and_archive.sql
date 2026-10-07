ALTER TABLE `sops` ADD `private` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE `sops` ADD `archived` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `sops` SET `private` = 0, `archived` = 0;
