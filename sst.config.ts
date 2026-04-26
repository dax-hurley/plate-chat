// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

/**
 * Production secrets: SST secret names below map to env vars on `Web` (see `run()`).
 *
 * GitHub Actions deploy (`.github/workflows/deploy.yml`) syncs secrets per stage (`staging`,
 * `prod`) from GitHub Environments with the same names, then `sst deploy --stage …`.
 * Override from a machine anytime, e.g.:
 *
 *   npx sst secret set --stage staging TursoDatabaseUrl "libsql://..."
 *   npx sst secret set --stage prod TursoDatabaseUrl "libsql://..."
 *   npx sst secret set --stage prod TursoAuthToken   "..."
 *   npx sst secret set --stage prod BetterAuthSecret "$(openssl rand -base64 32)"
 *   npx sst secret set --stage prod AppUrl           "https://platechat.ai"
 *   npx sst secret set --stage prod AnthropicApiKey  "sk-ant-..."
 *
 * Custom domain: production uses `platechat.ai` (www → apex). DNS is managed via
 * the default `sst.aws.dns()` (Route 53 in this AWS account). For Cloudflare,
 * Vercel, or manual DNS, see https://sst.dev/docs/custom-domains/
 *
 * NextAuth-era secrets (`AuthSecret`, `AuthUrl`) are no longer used — better-auth
 * + device tokens replace them.
 */
export default $config({
  app(input) {
    return {
      name: "workout-app",
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input?.stage),
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
      // Prod only: same zone cannot serve two stages. Staging keeps the CloudFront URL.
      ...($app.stage === "prod"
        ? {
            domain: {
              name: "platechat.ai",
              redirects: ["www.platechat.ai"],
            },
          }
        : {}),
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
