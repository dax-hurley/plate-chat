/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dev: simulate offline client behavior (see `isDevForceOffline` in `dev-force-offline.ts`). */
  readonly VITE_DEV_FORCE_OFFLINE?: string;
}
