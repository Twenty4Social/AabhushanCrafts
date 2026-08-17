import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
    globalIgnores([
      ".next/**",
      "out/**",
      "work/**",
      "outputs/**",
      "next-env.d.ts",
    ]),
]);
