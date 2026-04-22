# Workout App

Offline-first workout, nutrition, and coaching app. Runs as an installable PWA
on the web and as a Capacitor Android app that bundles the same SPA build.

## Stack

- **Client:** TanStack Start (Vite + TanStack Router) + React 19 + Tailwind 4.
- **Local store:** RxDB on IndexedDB (Dexie). Replication is HTTP pull/push
  against `/api/sync/:collection`.
- **Server:** TanStack Start server routes over Nitro. Auth via better-auth +
  device access/refresh tokens. Drizzle ORM on LibSQL/Turso for durable
  storage.
- **Deploy:** SST v4 (`sst.aws.TanStackStart`).

## Getting started

```bash
npm install
cp .env.example .env.local  # DATABASE_URL, BETTER_AUTH_SECRET, ANTHROPIC_API_KEY, …
npm run db:push             # sync Drizzle schema to the SQLite/Turso DB
npm run dev                 # http://localhost:3001
```

The app runs entirely from the client against IndexedDB — the server is only
needed for initial sign-in, periodic sync, and the two online-only features
(coach chat, shopping-list generation).

## Offline behavior

- All CRUD on workouts, nutrition, meal plans, profile, progress and schedules
  reads / writes through RxDB store hooks in `src/lib/stores/*`. Changes are
  queued locally and replicate automatically when the device is online.
- Coach chat and shopping-list generation show an offline banner and disable
  their send / generate buttons when offline. Previously synced conversations
  and generated lists remain readable from the local store.
- The global offline banner and `useOnline()` hook live in
  `src/components/app/app-shell.tsx` and `src/lib/client/use-online.ts`.

## Capacitor (Android)

The Android app bundles the SPA build — `webDir` points at `dist/client` and
`server.url` is intentionally unset so the app boots in airplane mode.

```bash
npm run build
npm run cap:sync
npm run cap:run:android
```

See `docs/capacitor-android.md` for detailed device setup.

## Project layout

```
src/
  routes/                # TanStack Router file-based routes (including /api/*)
  components/app/        # Shared app shell
  lib/
    client/              # Browser-side infra: auth-fetch, RxDB client, PWA-aware hooks
    stores/              # Reactive RxDB-backed React hooks per entity
  server/
    auth/                # better-auth config + device-token issuance
    sync/                # Generic pull/push engine for RxDB replication
  shared/schemas/        # Zod + RxDB JSON schemas (single source of truth)
  db/                    # Drizzle schema + LibSQL client
```

## Scripts

| Script                   | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `npm run dev`            | Vite dev server (TanStack Start, port 3001) |
| `npm run dev:android`    | Vite dev bound to 0.0.0.0 for on-device dev |
| `npm run build`          | Build the SPA + Nitro server                |
| `npm run start`          | Run the built Nitro server                  |
| `npm run db:push`        | Push the Drizzle schema to the DB           |
| `npm run db:generate`    | Generate a Drizzle migration                |
| `npm run db:seed`        | Seed exercise library                       |
| `npm run cap:sync`       | Copy the built SPA into the Android app     |
| `npm run cap:run:android`| Build + run on a connected device           |

## Secrets (SST)

```bash
npx sst secret set TursoDatabaseUrl  "libsql://..."
npx sst secret set TursoAuthToken    "..."
npx sst secret set BetterAuthSecret  "$(openssl rand -base64 32)"
npx sst secret set AppUrl            "https://…"
npx sst secret set AnthropicApiKey   "sk-ant-..."
```
