CREATE TABLE `standalone_forms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`base_pdf_key` text NOT NULL,
	`definition` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `standalone_form_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`student_id` text NOT NULL,
	`student_values` text DEFAULT '{}' NOT NULL,
	`parent_values` text DEFAULT '{}' NOT NULL,
	`student_submitted_at` integer,
	`parent_required` integer,
	`parent_completed_at` integer,
	`signed_pdf_key` text,
	FOREIGN KEY (`form_id`) REFERENCES `standalone_forms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`userid`) ON UPDATE no action ON DELETE cascade,
	UNIQUE(`form_id`, `student_id`)
);
