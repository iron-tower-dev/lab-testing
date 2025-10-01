-- Fix test_stand_table to add PRIMARY KEY constraint on id column
-- This migration corrects an issue where the id column was NOT NULL but lacked PRIMARY KEY
-- Required for foreign key references from lube_tech_qualification_table

-- SQLite doesn't support ALTER TABLE ADD PRIMARY KEY, so we need to recreate the table

-- Step 1: Create new table with correct schema
CREATE TABLE `test_stand_table_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text
);
--> statement-breakpoint

-- Step 2: Copy data from old table to new table
INSERT INTO `test_stand_table_new` (`id`, `name`)
SELECT `id`, `name` FROM `test_stand_table`;
--> statement-breakpoint

-- Step 3: Drop old table
DROP TABLE `test_stand_table`;
--> statement-breakpoint

-- Step 4: Rename new table to original name
ALTER TABLE `test_stand_table_new` RENAME TO `test_stand_table`;
--> statement-breakpoint

-- Note: Foreign key constraints from other tables (like lube_tech_qualification_table)
-- should now work correctly as test_stand_table.id is properly defined as PRIMARY KEY
