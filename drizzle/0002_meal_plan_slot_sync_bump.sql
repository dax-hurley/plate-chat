-- Incremental pull uses (updatedAt, id). AI/HTTP slot updates only changed
-- `libraryItemId` without bumping `updatedAt`, so clients never received those
-- changes after the initial row. Touch every row once so existing server
-- assignments replicate to offline clients.
UPDATE "meal_plan_slots" SET
  "updatedAt" = (cast(unixepoch('subsecond') * 1000 as integer)),
  "rev" = COALESCE("rev", 0) + 1;
