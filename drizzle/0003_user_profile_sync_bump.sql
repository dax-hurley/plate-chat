-- Same pattern as 0002: HTTP/AI profile updates had not bumped `updatedAt`, so
-- incremental `user_profiles` pull missed changes after the first row sync.
UPDATE "user_profiles" SET
  "updatedAt" = (cast(unixepoch('subsecond') * 1000 as integer)),
  "rev" = COALESCE("rev", 0) + 1;
