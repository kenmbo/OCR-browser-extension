import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const nonProductionImports = [
  "**/build/**",
  "**/dist/**",
  "**/fixtures/**",
  "**/generated/**",
  "**/tests/**",
  "**/tools/**",
];

const sharedBrowserGlobals = [
  "Blob",
  "Element",
  "Event",
  "HTMLElement",
  "ImageData",
  "Worker",
  "browser",
  "document",
  "fetch",
  "globalThis",
  "location",
  "window",
].map((name) => ({
  message: "Shared production code must not use browser or DOM globals.",
  name,
}));

function typedProject(files, project) {
  return {
    files,
    languageOptions: {
      parserOptions: {
        project,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  };
}

export default tseslint.config(
  {
    ignores: ["node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  typedProject(["src/shared/**/*.ts"], "./tsconfig.shared.json"),
  typedProject(["src/platform/chromium/**/*.ts"], "./tsconfig.chromium.json"),
  typedProject(["src/platform/firefox/**/*.ts"], "./tsconfig.firefox.json"),
  typedProject(["tools/**/*.ts"], "./tsconfig.tools.json"),
  typedProject(["tests/**/*.ts", "vitest.config.ts"], "./tsconfig.tests.json"),
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: nonProductionImports,
              message:
                "Production source cannot import tools, tests, fixtures, generated files, or build output.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**/*.ts"],
    rules: {
      "no-restricted-globals": ["error", ...sharedBrowserGlobals],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [...nonProductionImports, "**/platform/**"],
              message:
                "Shared production source cannot import platform or non-production modules.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/platform/chromium/**/*.ts"],
    languageOptions: {
      globals: {
        chrome: "readonly",
      },
    },
    rules: {
      "no-restricted-globals": [
        "error",
        {
          message: "Chromium source cannot use the Firefox browser namespace.",
          name: "browser",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                ...nonProductionImports,
                "**/platform/firefox/**",
                "@types/firefox-webext-browser",
              ],
              message:
                "Chromium source cannot import Firefox or non-production modules.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/platform/firefox/**/*.ts"],
    languageOptions: {
      globals: {
        browser: "readonly",
      },
    },
    rules: {
      "no-restricted-globals": [
        "error",
        {
          message: "Firefox source cannot use the Chromium chrome namespace.",
          name: "chrome",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                ...nonProductionImports,
                "**/platform/chromium/**",
                "@types/chrome",
              ],
              message:
                "Firefox source cannot import Chromium or non-production modules.",
            },
          ],
        },
      ],
    },
  },
);

