CREATE TABLE `particle_sub_type_category_definition_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`active` text,
	`sortOrder` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `particle_sub_type_definition_table` (
	`particleSubTypeCategoryId` integer NOT NULL,
	`value` integer NOT NULL,
	`description` text NOT NULL,
	`active` text,
	`sortOrder` integer
);
--> statement-breakpoint
CREATE TABLE `particle_sub_type_table` (
	`sampleId` integer NOT NULL,
	`testId` integer NOT NULL,
	`particleTypeDefinitionId` integer NOT NULL,
	`particleSubTypeCategory` integer NOT NULL,
	`value` integer
);
--> statement-breakpoint
CREATE TABLE `particle_type_definition_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`image1` text NOT NULL,
	`image2` text NOT NULL,
	`active` text,
	`sortOrder` integer
);
--> statement-breakpoint
CREATE TABLE `particle_type_table` (
	`sampleId` integer NOT NULL,
	`testId` integer NOT NULL,
	`particleTypeDefinitionId` integer NOT NULL,
	`status` text,
	`comments` text
);
--> statement-breakpoint
CREATE TABLE `test_list_table` (
	`status` integer,
	`description` text
);
--> statement-breakpoint
CREATE TABLE `test_readings_table` (
	`sampleId` integer,
	`testId` integer,
	`trialNumber` integer,
	`value1` real,
	`value2` real,
	`value3` real,
	`trialCalc` real,
	`id1` text,
	`id2` text,
	`id3` text,
	`trialComplete` integer,
	`status` text,
	`schedType` text,
	`entryId` text,
	`validateId` text,
	`entryDate` integer,
	`valiDate` integer,
	`mainComments` text
);
--> statement-breakpoint
CREATE TABLE `test_schedule_rule_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`groupId` integer NOT NULL,
	`testId` integer NOT NULL,
	`ruleTestId` integer NOT NULL,
	`upperRule` integer NOT NULL,
	`ruleAction` text
);
--> statement-breakpoint
CREATE TABLE `test_schedule_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag` text,
	`componentCode` text,
	`locationCode` text,
	`material` text
);
--> statement-breakpoint
CREATE TABLE `test_schedule_test_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`testScheduleId` integer NOT NULL,
	`testId` integer NOT NULL,
	`testInterval` integer,
	`minimumInterval` integer,
	`duringMonth` integer,
	`details` text
);
--> statement-breakpoint
CREATE TABLE `test_stand_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text
);
--> statement-breakpoint
CREATE TABLE `test_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`testStandId` integer,
	`sampleVolumeRequired` integer,
	`exclude` text,
	`abbrev` text,
	`displayedGroupId` integer,
	`groupName` text,
	`lab` integer,
	`schedule` integer,
	`shortAbbrev` text
);
--> statement-breakpoint
CREATE TABLE `users_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`age` integer NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_table_email_unique` ON `users_table` (`email`);