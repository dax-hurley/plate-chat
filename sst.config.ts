// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

/**
 * Production secrets: SST secret names below map to env vars on `Web` (see `run()`).
 *
 * GitHub Actions deploy (`.github/workflows/deploy.yml`) runs `sst secret load` from
 * repository secrets before `sst deploy`. You can still set or override from a machine:
 *
 *   npx sst secret set --stage production TursoDatabaseUrl "libsql://..."
 *   npx sst secret set --stage production TursoAuthToken "..."
 *   npx sst secret set --stage production AuthSecret "$(openssl rand -base64 32)"   → AUTH_SECRET
 *   npx sst secret set --stage production AuthUrl "https://…"
 *   npx sst secret set --stage production AnthropicApiKey "sk-ant-..."   # Claude: coach + AI shopping list (required in prod)
 *
 * Local Next + file SQLite: use `npm run dev` and `.env.local` (no SST required).
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
    const authSecret = new sst.Secret("AuthSecret");
    const authUrl = new sst.Secret("AuthUrl");
    const anthropicApiKey = new sst.Secret("AnthropicApiKey");

    new sst.aws.Nextjs("Web", {
      link: [tursoUrl, tursoToken, authSecret, authUrl, anthropicApiKey],
      environment: {
        DATABASE_URL: tursoUrl.value,
        DATABASE_AUTH_TOKEN: tursoToken.value,
        AUTH_SECRET: authSecret.value,
        AUTH_URL: authUrl.value,
        NEXT_PUBLIC_APP_URL: authUrl.value,
        ANTHROPIC_API_KEY: anthropicApiKey.value,
      },
    });
  },
});
