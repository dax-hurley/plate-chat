import type { NextConfig } from "next";

import { DEV_DEFAULT_APP_ORIGIN } from "./src/lib/app-origin-defaults";

const devOriginFallback =
  process.env.NODE_ENV === "development" ? DEV_DEFAULT_APP_ORIGIN : "";

const nextConfig: NextConfig = {
  env: {
    AUTH_URL:
      process.env.AUTH_URL ??
      process.env.NEXTAUTH_URL ??
      devOriginFallback,
    // next-auth/react reads NEXTAUTH_URL for __NEXTAUTH; keep aligned with AUTH_URL.
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ??
      process.env.AUTH_URL ??
      devOriginFallback,
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ?? devOriginFallback,
  },
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/app/settings",
        destination: "/app/profile",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
