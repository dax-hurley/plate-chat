// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

/**
 * Production secrets: SST secret names below map to env vars on `Web` (see `run()`).
 *
 * GitHub Actions deploy (`.github/workflows/deploy.yml`) syncs secrets per stage (`staging`,
 * `production`) from GitHub Environments with the same names, then `sst deploy --stage …`.
 * Override from a machine anytime, e.g.:
 *
 *   npx sst secret set --stage staging TursoDatabaseUrl "libsql://..."
 *   npx sst secret set --stage production TursoDatabaseUrl "libsql://..."
 *   npx sst secret set --stage production TursoAuthToken   "..."
 *   npx sst secret set --stage production BetterAuthSecret "$(openssl rand -base64 32)"
 *   npx sst secret set --stage production AppUrl           "https://…"
 *   npx sst secret set --stage production AnthropicApiKey  "sk-ant-..."
 *
 * NextAuth-era secrets (`AuthSecret`, `AuthUrl`) are no longer used — better-auth
 * + device tokens replace them.
 */
export default $config({
  app(input) {
    return {
      name: "workout-app",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const tursoUrl = new sst.Secret("TursoDatabaseUrl");
    const tursoToken = new sst.Secret("TursoAuthToken");
    const betterAuthSecret = new sst.Secret("BetterAuthSecret");
    const appUrl = new sst.Secret("AppUrl");
    const anthropicApiKey = new sst.Secret("AnthropicApiKey");

    const web = new sst.aws.TanStackStart("Web", {
      link: [
        tursoUrl,
        tursoToken,
        betterAuthSecret,
        appUrl,
        anthropicApiKey,
      ],
      environment: {
        DATABASE_URL: tursoUrl.value,
        DATABASE_AUTH_TOKEN: tursoToken.value,
        BETTER_AUTH_SECRET: betterAuthSecret.value,
        BETTER_AUTH_URL: appUrl.value,
        APP_URL: appUrl.value,
        ANTHROPIC_API_KEY: anthropicApiKey.value,
        VITE_API_URL: appUrl.value,
      },
    });

    // Exposed in `sst state export` / deploy summary (GitHub Actions reads this).
    return {
      cloudfrontUrl: web.url,
    };
  },
});
