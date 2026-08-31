import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    "**/.next/**",
    "node_modules/**",
    "**/node_modules/**",
    "playwright-report/**",
    "**/playwright-report/**",
    "test-results/**",
    "**/test-results/**",
    ".worktrees/**",
  ]),
]);
