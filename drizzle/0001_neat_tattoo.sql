CREATE TABLE `kcc_stored_files` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`kind` text NOT NULL,
	`target` text NOT NULL,
	`evidence_index` integer,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`sha256` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`subject` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text NOT NULL
);
