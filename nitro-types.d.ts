import "nitro/types";

declare module "nitro/types" {
  // nitro@3.0.0: aws-lambda preset reads options.awsLambda at runtime but types omit it
  interface NitroConfig {
    awsLambda?: { streaming?: boolean };
  }
}
