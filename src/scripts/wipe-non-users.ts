/**
 * Deletes all application data while keeping `user` rows and their
 * better-auth credentials (`ba_account`). Sessions and device tokens are
 * cleared so every device must re-login.
 *
 * Usage: `npm run db:wipe-non-users` — you will be prompted to type `yes`.
 * Env: DATABASE_URL (optional, defaults to file:./data/local.db).
 */

import "./load-env";

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  baSessions,
  baVerifications,
  coachConversations,
  deviceTokens,
  exercises,
  mealEntries,
  mealLibraryIngredients,
  mealLibraryItems,
  mealPlanSlots,
  mealPlans,
  meals,
  personalAccessTokens,
  userProfiles,
  userVitalEntries,
  users,
  workoutRecurringRules,
  workoutRecurringSkips,
  workoutRoutineGroups,
  workoutScheduledItems,
  workoutSessionExercisePrefs,
  workoutSessions,
  workoutSets,
  workoutTemplateItems,
  workoutTemplates,
} from "@/db/schema";

/** Child / dependent tables first. */
const TABLES_IN_DELETE_ORDER = [
  workoutSets,
  workoutSessionExercisePrefs,
  mealEntries,
  mealPlanSlots,
  mealPlans,
  mealLibraryIngredients,
  workoutRecurringSkips,
  workoutRecurringRules,
  workoutScheduledItems,
  workoutTemplateItems,
  workoutSessions,
  workoutTemplates,
  workoutRoutineGroups,
  meals,
  mealLibraryItems,
  userVitalEntries,
  userProfiles,
  coachConversations,
  exercises,
  baSessions,
  baVerifications,
  deviceTokens,
  personalAccessTokens,
] as const;

async function confirmInteractive(): Promise<boolean> {
  if (!input.isTTY) {
    console.error(
      "Refusing to run: not a TTY. Run this script in a terminal so you can confirm interactively."
    );
    return false;
  }
  const rl = readline.createInterface({ input, output });
  try {
    const line = await rl.question(
      'This will delete ALL app data and clear sessions/device tokens, keeping `user` rows and their credentials. Type "yes" to continue: '
    );
    return line.trim().toLowerCase() === "yes";
  } finally {
    await rl.close();
  }
}

async function main() {
  if (!(await confirmInteractive())) {
    console.error("Aborted.");
    process.exit(1);
  }

  const [{ n: userCount }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(users);

  console.log(`Keeping ${userCount} user(s). Wiping all other tables…`);

  for (const table of TABLES_IN_DELETE_ORDER) {
    await db.delete(table).where(sql`1`);
  }

  console.log("Done. Users preserved; all other rows cleared.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
