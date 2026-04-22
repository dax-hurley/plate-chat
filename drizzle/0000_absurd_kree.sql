CREATE TABLE `ba_account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ba_account_user_idx` ON `ba_account` (`userId`);--> statement-breakpoint
CREATE TABLE `ba_session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ba_session_token_unique` ON `ba_session` (`token`);--> statement-breakpoint
CREATE INDEX `ba_session_user_idx` ON `ba_session` (`userId`);--> statement-breakpoint
CREATE TABLE `ba_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coach_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`title` text DEFAULT 'New chat' NOT NULL,
	`messages` text DEFAULT '[]' NOT NULL,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `coach_conversations_user_idx` ON `coach_conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `coach_conversations_user_updated_idx` ON `coach_conversations` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `coach_conversations_sync_idx` ON `coach_conversations` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `device_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`deviceName` text DEFAULT '' NOT NULL,
	`refreshTokenHash` text NOT NULL,
	`accessExpiresAt` integer NOT NULL,
	`refreshExpiresAt` integer NOT NULL,
	`revokedAt` integer,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`lastSeenAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_tokens_refreshTokenHash_unique` ON `device_tokens` (`refreshTokenHash`);--> statement-breakpoint
CREATE INDEX `device_tokens_user_idx` ON `device_tokens` (`userId`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`name` text NOT NULL,
	`muscleGroup` text,
	`logKind` text DEFAULT 'reps' NOT NULL,
	`defaultDurationSec` integer,
	`defaultDistance` real,
	`distanceUnit` text DEFAULT 'km' NOT NULL,
	`weightUnit` text DEFAULT 'lb' NOT NULL,
	`trackWeight` integer DEFAULT true NOT NULL,
	`isCustom` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `exercises_user_idx` ON `exercises` (`userId`);--> statement-breakpoint
CREATE INDEX `exercises_sync_idx` ON `exercises` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `meal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`mealId` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`calories` integer DEFAULT 0 NOT NULL,
	`proteinG` real DEFAULT 0 NOT NULL,
	`carbsG` real DEFAULT 0 NOT NULL,
	`fatG` real DEFAULT 0 NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`mealId`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `meal_entries_meal_idx` ON `meal_entries` (`mealId`);--> statement-breakpoint
CREATE INDEX `meal_entries_sync_idx` ON `meal_entries` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `meal_library_ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`libraryItemId` text NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`line` text NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`libraryItemId`) REFERENCES `meal_library_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `meal_library_ingredients_item_idx` ON `meal_library_ingredients` (`libraryItemId`);--> statement-breakpoint
CREATE INDEX `meal_library_ingredients_sync_idx` ON `meal_library_ingredients` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `meal_library_items` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`calories` integer DEFAULT 0 NOT NULL,
	`proteinG` real DEFAULT 0 NOT NULL,
	`carbsG` real DEFAULT 0 NOT NULL,
	`fatG` real DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `meal_library_items_user_idx` ON `meal_library_items` (`userId`);--> statement-breakpoint
CREATE INDEX `meal_library_items_user_name_idx` ON `meal_library_items` (`userId`,`name`);--> statement-breakpoint
CREATE INDEX `meal_library_items_sync_idx` ON `meal_library_items` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `meal_plan_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`planId` text NOT NULL,
	`dayIndex` integer NOT NULL,
	`slotIndex` integer DEFAULT 0 NOT NULL,
	`slotKind` text DEFAULT 'meal' NOT NULL,
	`label` text DEFAULT 'Meal' NOT NULL,
	`libraryItemId` text,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`planId`) REFERENCES `meal_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`libraryItemId`) REFERENCES `meal_library_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meal_plan_slots_plan_day_slot_uq` ON `meal_plan_slots` (`planId`,`dayIndex`,`slotIndex`);--> statement-breakpoint
CREATE INDEX `meal_plan_slots_plan_idx` ON `meal_plan_slots` (`planId`);--> statement-breakpoint
CREATE INDEX `meal_plan_slots_sync_idx` ON `meal_plan_slots` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `meal_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`weekStartDayKey` text NOT NULL,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`aiShoppingListJson` text DEFAULT '[]' NOT NULL,
	`shoppingListSourceHash` text,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meal_plans_user_week_uq` ON `meal_plans` (`userId`,`weekStartDayKey`);--> statement-breakpoint
CREATE INDEX `meal_plans_sync_idx` ON `meal_plans` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `meals` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`dayKey` text NOT NULL,
	`loggedAt` integer NOT NULL,
	`name` text NOT NULL,
	`sourceLibraryItemId` text,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `meals_user_logged_idx` ON `meals` (`userId`,`loggedAt`);--> statement-breakpoint
CREATE INDEX `meals_user_day_idx` ON `meals` (`userId`,`dayKey`);--> statement-breakpoint
CREATE INDEX `meals_source_library_idx` ON `meals` (`sourceLibraryItemId`);--> statement-breakpoint
CREATE INDEX `meals_sync_idx` ON `meals` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `personal_access_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`tokenHash` text NOT NULL,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`lastUsedAt` integer,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personal_access_tokens_tokenHash_unique` ON `personal_access_tokens` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `personal_access_tokens_user_idx` ON `personal_access_tokens` (`userId`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`userId` text PRIMARY KEY NOT NULL,
	`heightIn` real,
	`goalPreset` text DEFAULT 'custom' NOT NULL,
	`fitnessGoals` text,
	`preferences` text,
	`goalCalories` integer,
	`goalProteinG` real,
	`goalCarbsG` real,
	`goalFatG` real,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_vital_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`vitalKey` text NOT NULL,
	`dayKey` text NOT NULL,
	`value` real NOT NULL,
	`recordedAt` integer NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_vital_entries_user_key_day_uq` ON `user_vital_entries` (`userId`,`vitalKey`,`dayKey`);--> statement-breakpoint
CREATE INDEX `user_vital_entries_user_day_idx` ON `user_vital_entries` (`userId`,`dayKey`);--> statement-breakpoint
CREATE INDEX `user_vital_entries_user_key_idx` ON `user_vital_entries` (`userId`,`vitalKey`);--> statement-breakpoint
CREATE INDEX `user_vital_entries_sync_idx` ON `user_vital_entries` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `workout_recurring_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`templateId` text NOT NULL,
	`intervalWeeks` integer DEFAULT 1 NOT NULL,
	`byDay` text NOT NULL,
	`startDayKey` text NOT NULL,
	`untilDayKey` text,
	`notes` text,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`templateId`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_recurring_rules_user_idx` ON `workout_recurring_rules` (`userId`);--> statement-breakpoint
CREATE INDEX `workout_recurring_rules_sync_idx` ON `workout_recurring_rules` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `workout_recurring_skips` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`ruleId` text NOT NULL,
	`dayKey` text NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`ruleId`) REFERENCES `workout_recurring_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_recurring_skips_rule_day_uq` ON `workout_recurring_skips` (`ruleId`,`dayKey`);--> statement-breakpoint
CREATE INDEX `workout_recurring_skips_sync_idx` ON `workout_recurring_skips` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `workout_routine_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workout_routine_groups_user_idx` ON `workout_routine_groups` (`userId`);--> statement-breakpoint
CREATE INDEX `workout_routine_groups_user_sort_idx` ON `workout_routine_groups` (`userId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `workout_routine_groups_sync_idx` ON `workout_routine_groups` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `workout_scheduled_items` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`templateId` text NOT NULL,
	`dayKey` text NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`templateId`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_scheduled_user_day_idx` ON `workout_scheduled_items` (`userId`,`dayKey`);--> statement-breakpoint
CREATE INDEX `workout_scheduled_template_idx` ON `workout_scheduled_items` (`templateId`);--> statement-breakpoint
CREATE INDEX `workout_scheduled_sync_idx` ON `workout_scheduled_items` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `workout_session_exercise_prefs` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`sessionId` text NOT NULL,
	`exerciseId` text NOT NULL,
	`workingWeight` real,
	`workingDurationSec` integer,
	`workingDistance` real,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_session_exercise_prefs_session_ex_uq` ON `workout_session_exercise_prefs` (`sessionId`,`exerciseId`);--> statement-breakpoint
CREATE INDEX `workout_session_exercise_prefs_session_idx` ON `workout_session_exercise_prefs` (`sessionId`);--> statement-breakpoint
CREATE INDEX `workout_session_exercise_prefs_sync_idx` ON `workout_session_exercise_prefs` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`templateId` text,
	`startedAt` integer NOT NULL,
	`endedAt` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`templateId`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `workout_sessions_user_idx` ON `workout_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `workout_sessions_status_idx` ON `workout_sessions` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `workout_sessions_sync_idx` ON `workout_sessions` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`sessionId` text NOT NULL,
	`exerciseId` text NOT NULL,
	`setIndex` integer NOT NULL,
	`reps` integer,
	`durationSec` integer,
	`distance` real,
	`weight` real NOT NULL,
	`rpe` real,
	`completedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_sets_session_idx` ON `workout_sets` (`sessionId`);--> statement-breakpoint
CREATE INDEX `workout_sets_session_exercise_idx` ON `workout_sets` (`sessionId`,`exerciseId`);--> statement-breakpoint
CREATE INDEX `workout_sets_sync_idx` ON `workout_sets` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `workout_template_items` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`templateId` text NOT NULL,
	`exerciseId` text NOT NULL,
	`order` integer NOT NULL,
	`targetSets` integer DEFAULT 3 NOT NULL,
	`targetReps` integer,
	`targetDurationSec` integer,
	`targetDistance` real,
	`defaultWeight` real,
	`weightUnit` text,
	`progressiveOverloadEnabled` integer DEFAULT false NOT NULL,
	`progressiveOverloadIncrement` real,
	`progressiveOverloadRequireFullCompletion` integer DEFAULT false NOT NULL,
	`trackWeight` integer DEFAULT true NOT NULL,
	`logTimeForDistanceSets` integer DEFAULT false NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`templateId`) REFERENCES `workout_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_template_items_template_idx` ON `workout_template_items` (`templateId`);--> statement-breakpoint
CREATE INDEX `workout_template_items_exercise_idx` ON `workout_template_items` (`exerciseId`);--> statement-breakpoint
CREATE INDEX `workout_template_items_sync_idx` ON `workout_template_items` (`userId`,`updatedAt`,`id`);--> statement-breakpoint
CREATE TABLE `workout_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`routineGroupId` text,
	`routineOrder` integer,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deletedAt` integer,
	`rev` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`routineGroupId`) REFERENCES `workout_routine_groups`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `workout_templates_user_idx` ON `workout_templates` (`userId`);--> statement-breakpoint
CREATE INDEX `workout_templates_routine_group_idx` ON `workout_templates` (`routineGroupId`);--> statement-breakpoint
CREATE INDEX `workout_templates_sync_idx` ON `workout_templates` (`userId`,`updatedAt`,`id`);