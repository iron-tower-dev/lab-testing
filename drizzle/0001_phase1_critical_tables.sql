-- Phase 1: Critical Tables for Authorization & Sample Management
-- Generated: 2025-09-30

-- Lube Tech Qualification Table
CREATE TABLE `lube_tech_qualification_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employeeId` text NOT NULL,
	`testStandId` integer NOT NULL,
	`qualificationLevel` text NOT NULL,
	`certifiedDate` integer NOT NULL,
	`certifiedBy` text,
	`expirationDate` integer,
	`active` integer DEFAULT true,
	`notes` text,
	FOREIGN KEY (`testStandId`) REFERENCES `test_stand_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_emp_teststand_idx` ON `lube_tech_qualification_table` (`employeeId`,`testStandId`);
--> statement-breakpoint
CREATE INDEX `lube_tech_qual_teststand_idx` ON `lube_tech_qualification_table` (`testStandId`);
--> statement-breakpoint
CREATE INDEX `lube_tech_qual_employee_idx` ON `lube_tech_qualification_table` (`employeeId`);
--> statement-breakpoint
CREATE INDEX `lube_tech_qual_active_idx` ON `lube_tech_qualification_table` (`active`);
--> statement-breakpoint

-- Used Lube Samples Table (Master Sample Table)
CREATE TABLE `used_lube_samples_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tagNumber` text,
	`component` text,
	`location` text,
	`lubeType` text,
	`newUsedFlag` integer,
	`sampleDate` integer,
	`status` integer,
	`returnedDate` integer,
	`priority` integer,
	`assignedDate` integer,
	`assignedTo` text,
	`receivedDate` integer,
	`oilAdded` real,
	`comments` text
);
--> statement-breakpoint
CREATE INDEX `used_lube_samples_tag_idx` ON `used_lube_samples_table` (`tagNumber`);
--> statement-breakpoint
CREATE INDEX `used_lube_samples_status_idx` ON `used_lube_samples_table` (`status`);
--> statement-breakpoint
CREATE INDEX `used_lube_samples_component_idx` ON `used_lube_samples_table` (`component`);
--> statement-breakpoint
CREATE INDEX `used_lube_samples_location_idx` ON `used_lube_samples_table` (`location`);
--> statement-breakpoint
CREATE INDEX `used_lube_samples_assigned_idx` ON `used_lube_samples_table` (`assignedTo`);
--> statement-breakpoint

-- Component Lookup Table
CREATE TABLE `component_table` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer DEFAULT true,
	`sortOrder` integer
);
--> statement-breakpoint
CREATE INDEX `component_active_idx` ON `component_table` (`active`);
--> statement-breakpoint
CREATE INDEX `component_sort_idx` ON `component_table` (`sortOrder`);
--> statement-breakpoint

-- Location Lookup Table
CREATE TABLE `location_table` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`active` integer DEFAULT true,
	`sortOrder` integer
);
--> statement-breakpoint
CREATE INDEX `location_active_idx` ON `location_table` (`active`);
--> statement-breakpoint
CREATE INDEX `location_sort_idx` ON `location_table` (`sortOrder`);
