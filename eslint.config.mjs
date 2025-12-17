import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Disable specific rules for remaining non-critical issues
  {
    rules: {
      // Allow explicit any in specific contexts where it's necessary
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused variables in some contexts
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      // Allow setState in effects for this specific case
      "react-hooks/set-state-in-effect": "off"
    }
  }
]);

export default eslintConfig;
