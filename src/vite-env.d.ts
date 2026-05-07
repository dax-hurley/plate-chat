/// <reference types="vite/client" />

/** Baked from `COACH_AI_DEBUG` / `VITE_COACH_AI_DEBUG` at dev/build (see `vite.config.mts`). */
declare const __COACH_AI_DEBUG_CLIENT__: string;

interface ImportMetaEnv {
  /** Dev: simulate offline client behavior (see `isDevForceOffline` in `dev-force-offline.ts`). */
  readonly VITE_DEV_FORCE_OFFLINE?: string;
}
