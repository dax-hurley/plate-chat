import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";

import { db } from "@/db/client";
import { mealLibraryIngredients, mealLibraryItems } from "@/db/schema";

function escapeLikePattern(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type LibraryIngredientInput = { line: string };

export async function listLibraryItems(userId: string, query?: string) {
  const q = query?.trim();
  if (!q) {
    return db.query.mealLibraryItems.findMany({
      where: eq(mealLibraryItems.userId, userId),
      orderBy: [desc(mealLibraryItems.updatedAt)],
      with: {
        ingredients: {
          orderBy: [asc(mealLibraryIngredients.sortOrder)],
        },
      },
    });
  }

  const pattern = `%${escapeLikePattern(q)}%`;

  const ingRows = await db
    .selectDistinct({ libraryItemId: mealLibraryIngredients.libraryItemId })
    .from(mealLibraryIngredients)
    .innerJoin(
      mealLibraryItems,
      eq(mealLibraryItems.id, mealLibraryIngredients.libraryItemId)
    )
    .where(
      and(
        eq(mealLibraryItems.userId, userId),
        like(mealLibraryIngredients.line, pattern)
      )
    );

  const ingIds = ingRows.map((r) => r.libraryItemId).filter(Boolean) as string[];

  const matches = or(
    like(mealLibraryItems.name, pattern),
    like(mealLibraryItems.instructions, pattern),
    ...(ingIds.length ? [inArray(mealLibraryItems.id, ingIds)] : [])
  );

  return db.query.mealLibraryItems.findMany({
    where: and(eq(mealLibraryItems.userId, userId), matches),
    orderBy: [desc(mealLibraryItems.updatedAt)],
    with: {
      ingredients: {
        orderBy: [asc(mealLibraryIngredients.sortOrder)],
      },
    },
  });
}

export async function getLibraryItem(userId: string, id: string) {
  return db.query.mealLibraryItems.findFirst({
    where: and(eq(mealLibraryItems.id, id), eq(mealLibraryItems.userId, userId)),
    with: {
      ingredients: {
        orderBy: [asc(mealLibraryIngredients.sortOrder)],
      },
    },
  });
}

export async function createLibraryItem(
  userId: string,
  input: {
    name: string;
    instructions: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    ingredients: LibraryIngredientInput[];
  }
) {
  const now = new Date();
  const [row] = await db
    .insert(mealLibraryItems)
    .values({
      userId,
      name: input.name.trim(),
      instructions: input.instructions.trim(),
      calories: Math.round(input.calories),
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      updatedAt: now,
    })
    .returning();

  const lines = input.ingredients
    .map((i) => i.line.trim())
    .filter((l) => l.length > 0);
  if (lines.length > 0) {
    await db.insert(mealLibraryIngredients).values(
      lines.map((line, sortOrder) => ({
        libraryItemId: row.id,
        sortOrder,
        line,
      }))
    );
  }

  return getLibraryItem(userId, row.id);
}

export async function updateLibraryItem(
  userId: string,
  id: string,
  input: {
    name: string;
    instructions: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    ingredients: LibraryIngredientInput[];
  }
) {
  const existing = await getLibraryItem(userId, id);
  if (!existing) return null;

  const now = new Date();
  await db
    .update(mealLibraryItems)
    .set({
      name: input.name.trim(),
      instructions: input.instructions.trim(),
      calories: Math.round(input.calories),
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      updatedAt: now,
    })
    .where(and(eq(mealLibraryItems.id, id), eq(mealLibraryItems.userId, userId)));

  await db
    .delete(mealLibraryIngredients)
    .where(eq(mealLibraryIngredients.libraryItemId, id));

  const lines = input.ingredients
    .map((i) => i.line.trim())
    .filter((l) => l.length > 0);
  if (lines.length > 0) {
    await db.insert(mealLibraryIngredients).values(
      lines.map((line, sortOrder) => ({
        libraryItemId: id,
        sortOrder,
        line,
      }))
    );
  }

  return getLibraryItem(userId, id);
}

export async function deleteLibraryItem(userId: string, id: string) {
  await db
    .delete(mealLibraryItems)
    .where(and(eq(mealLibraryItems.id, id), eq(mealLibraryItems.userId, userId)));
}
