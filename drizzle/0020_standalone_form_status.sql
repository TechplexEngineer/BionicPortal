ALTER TABLE `standalone_forms` ADD `status` text DEFAULT 'draft' NOT NULL;
UPDATE `standalone_forms`
SET `status` = 'assigned'
WHERE `id` IN (SELECT DISTINCT `form_id` FROM `standalone_form_assignments`);
