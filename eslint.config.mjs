import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "dist/**",
    "node_modules/**",
    ".output/**",
    ".sst/**",
    "src/routeTree.gen.ts",
    "android/**",
  ]),
]);

export default eslintConfig;
