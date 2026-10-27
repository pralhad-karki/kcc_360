CREATE TABLE `kcc_demo_sessions` (
	`subject` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kcc_server_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`revision` integer NOT NULL,
	`subject` text NOT NULL,
	`actor` text NOT NULL,
	`command` text NOT NULL,
	`record` text,
	`time` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kcc_workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`commit_id` text NOT NULL,
	`updated_at` text NOT NULL
);
