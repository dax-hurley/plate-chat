ALTER TABLE "user_profiles" ADD "sex" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD "activityLevel" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD "ageYears" integer;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD "onboardingCompletedAt" integer;--> statement-breakpoint
UPDATE "user_profiles" SET "onboardingCompletedAt" = "updatedAt" WHERE "onboardingCompletedAt" IS NULL;
