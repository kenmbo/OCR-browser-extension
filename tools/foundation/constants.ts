export const EXPECTED_NODE_VERSION = "v24.20.0";
export const EXPECTED_PNPM_VERSION = "12.3.4";
export const EXPECTED_ENVIRONMENT_DOCUMENT_SHA256 =
  "ec6f724dd3a00f55fd2620e97b0a145a664d206d2b7c5f7d2f4b81720b8c17d1";

export const EXPECTED_PACKAGE_METADATA = {
  name: "local-tesseract-ocr",
  type: "module",
  private: true,
  license: "Apache-2.0",
  packageManager: "pnpm@12.3.4",
  engines: { node: "24.20.0" },
} as const;

export const EXPECTED_DIRECT_DEV_DEPENDENCIES = {
  "@eslint/js": "10.0.1",
  "@playwright/test": "1.63.0",
  "@types/chrome": "0.2.9",
  "@types/firefox-webext-browser": "143.0.0",
  "@types/node": "24.13.4",
  eslint: "10.10.0",
  prettier: "3.9.6",
  "selenium-webdriver": "4.49.0",
  typescript: "6.0.3",
  "typescript-eslint": "8.70.0",
  vite: "8.3.0",
  vitest: "5.0.1",
  yaml: "2.9.1",
} as const;

export const EXPECTED_DIRECT_PACKAGE_METADATA = {
  "@eslint/js": {
    engines: "^20.19.0 || ^22.13.0 || >=24",
    license: "MIT",
  },
  "@playwright/test": { engines: ">=20", license: "Apache-2.0" },
  "@types/chrome": { engines: null, license: "MIT" },
  "@types/firefox-webext-browser": { engines: null, license: "MIT" },
  "@types/node": { engines: null, license: "MIT" },
  eslint: {
    engines: "^20.19.0 || ^22.13.0 || >=24",
    license: "MIT",
  },
  prettier: { engines: ">=14", license: "MIT" },
  "selenium-webdriver": {
    engines: ">= 22.0.0",
    license: "Apache-2.0",
  },
  typescript: { engines: ">=14.17", license: "Apache-2.0" },
  "typescript-eslint": {
    engines: "^18.18.0 || ^20.9.0 || >=21.1.0",
    license: "MIT",
  },
  vite: { engines: "^20.19.0 || >=22.12.0", license: "MIT" },
  vitest: {
    engines: "^22.12.0 || ^24.0.0 || >=26.0.0",
    license: "MIT",
  },
  yaml: { engines: ">= 14.6", license: "ISC" },
} as const;

export const EXPECTED_PACKAGE_SCRIPTS = {
  format:
    "prettier --write --ignore-unknown package.json pnpm-workspace.yaml tsconfig.json tsconfig.shared.json tsconfig.chromium.json tsconfig.firefox.json tsconfig.tools.json tsconfig.tests.json eslint.config.js vitest.config.ts src static tools tests docs/development.md docs/m2-feasibility.md docs/source-boundaries.md",
  "format:check":
    "prettier --check --ignore-unknown package.json pnpm-workspace.yaml tsconfig.json tsconfig.shared.json tsconfig.chromium.json tsconfig.firefox.json tsconfig.tools.json tsconfig.tests.json eslint.config.js vitest.config.ts src static tools tests docs/development.md docs/m2-feasibility.md docs/source-boundaries.md",
  typecheck:
    "pnpm run typecheck:shared && pnpm run typecheck:chromium && pnpm run typecheck:firefox && pnpm run typecheck:tools && pnpm run typecheck:tests",
  "typecheck:shared": "tsc --noEmit -p tsconfig.shared.json",
  "typecheck:chromium": "tsc --noEmit -p tsconfig.chromium.json",
  "typecheck:firefox": "tsc --noEmit -p tsconfig.firefox.json",
  "typecheck:tools": "tsc --noEmit -p tsconfig.tools.json",
  "typecheck:tests": "tsc --noEmit -p tsconfig.tests.json",
  lint: "eslint src tools tests vitest.config.ts --max-warnings 0",
  "test:unit": "vitest run --project unit-node",
  "test:m2-browser-lock":
    "vitest run --project unit-node tests/unit/browser-lock.test.ts",
  "check:imports": "node tools/check-imports.ts",
  "check:toolchain": "node tools/check-toolchain.ts",
  "check:lockfile": "node tools/check-lockfile.ts",
  "check:dependencies": "node tools/check-dependencies.ts",
  "check:licenses": "node tools/check-licenses.ts",
  "assembly:clean": "node tools/assembly/cli.ts clean",
  "assembly:build:production": "node tools/assembly/cli.ts build-production",
  "assembly:build:test": "node tools/assembly/cli.ts build-test",
  "assembly:build": "node tools/assembly/cli.ts build-all",
  "check:manifests": "node tools/assembly/cli.ts check-manifests",
  "check:assemblies": "node tools/assembly/cli.ts check-assemblies",
  "check:reproducibility": "node tools/assembly/cli.ts check-reproducibility",
  "package:local": "node tools/assembly/cli.ts package-local",
  "package:clean": "node tools/assembly/cli.ts package-clean",
  "check:archives": "node tools/assembly/cli.ts check-archives",
  "check:archive-reproducibility":
    "node tools/assembly/cli.ts check-archive-reproducibility",
  "check:immutable-install": "node tools/check-immutable-install.ts",
  "verify:m1":
    "pnpm run format:check && pnpm run typecheck && pnpm run lint && pnpm run test:unit && pnpm run check:toolchain && pnpm run check:lockfile && pnpm run check:dependencies && pnpm run check:licenses && pnpm run check:imports && pnpm run check:manifests && pnpm run assembly:build && pnpm run check:assemblies && pnpm run check:reproducibility && pnpm run package:local && pnpm run check:archives && pnpm run check:archive-reproducibility && pnpm run check:immutable-install",
} as const;

export const EXPECTED_MINIMUM_RELEASE_AGE_EXCLUSIONS = [
  "@vitest/mocker@5.0.1",
  "@vitest/spy@5.0.1",
  "vitest@5.0.1",
] as const;

export const ALLOWED_LICENSES = new Set([
  "(MIT AND Zlib)",
  "(MIT OR GPL-3.0-or-later)",
  "Apache-2.0",
  "BlueOak-1.0.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "MIT",
  "MPL-2.0",
]);

export const REVIEWED_PACKAGES_WITHOUT_LICENSE_FILES = new Set([
  "@bazel/runfiles@6.5.0",
  "@humanfs/types@0.15.0",
  "@rolldown/binding-linux-x64-gnu@1.2.8",
  "esrecurse@4.3.0",
  "ignore@5.3.2",
  "ignore@7.0.9",
  "imurmurhash@0.1.4",
  "isarray@1.0.0",
  "natural-compare@1.4.0",
  "punycode@2.3.1",
  "stackback@0.0.2",
]);

export const FORBIDDEN_PACKAGE_NAMES = new Set([
  "addons-linter",
  "fflate",
  "tesseract.js",
  "tesseract.js-core",
  "web-ext",
]);

export const EXPECTED_RUNNER_LOCK_INTEGRITIES = {
  "@bazel/runfiles@6.5.0":
    "sha512-RzahvqTkfpY2jsDxo8YItPX+/iZ6hbiikw1YhE0bA9EKBR5Og8Pa6FHn9PO9M0zaXRVsr0GFQLKbB/0rzy9SzA==",
  "@playwright/test@1.63.0":
    "sha512-oxMK4vllB9RK5NQ2l1pq1IfOf2AvnEuj/vYGDj0H2nMtmtZpKtCwt/l00GEO6xjGfpBNAvjovvYdCm50dRQkpQ==",
  "core-util-is@1.0.3":
    "sha512-ZQBvi1DcpJ4GDqanjucZ2Hj3wEO5pZDS89BWbkcrvdxksJorwUDDZamX9ldFkp9aw2lmBDLgkObEA4DWNJ9FYQ==",
  "immediate@3.0.6":
    "sha512-XXOFtyqDjNDAQxVfYxuF7g9Il/IbWmmlQg2MYKOH8ExIT1qg6xc4zyS3HaEEATgs1btfzxq15ciUiY7gjSXRGQ==",
  "inherits@2.0.4":
    "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
  "isarray@1.0.0":
    "sha512-VLghIWNM6ELQzo7zwmcg0NmTVyWKYjvIeM83yjp0wRDTmUnrM678fQbcKBo6n2CJEF0szoG//ytg+TKla89ALQ==",
  "jszip@3.10.2":
    "sha512-3l+rb15IOWtUhU0H5MFqES/T6Kh7abYwjosBey/vD6hDt8zoEffkSC5Ws5SGtgVw3gBx2NEbhTeSW1+kWkpyTQ==",
  "lie@3.3.0":
    "sha512-UaiMJzeWRlEujzAuw5LokY1L5ecNQYZKfmyZ9L7wDHb/p5etKaxXhohBcrw0EYby+G/NA52vRSN4N39dxHAIwQ==",
  "pako@1.0.11":
    "sha512-4hLB8Py4zZce5s4yd9XzopqwVv/yGNhV1Bl8NTmCq1763HeK2+EwVTv+leGeL13Dnh2wfbqowVPXCIO0z4taYw==",
  "playwright-core@1.63.0":
    "sha512-rYCsBF/M5HjUch52bbtVONEFjv6Xu8sm8h72dNlR5bzIE1fvC/bxgspzkjSfU+MweEMmPM8KJebG6nnyxo5mCg==",
  "playwright@1.63.0":
    "sha512-+7ziBLidS4NaNCdt57SUDT+wYmmd5fmiQejUic/kb+YsYSCPyOOE9sebzMjNmQrsnNpDJqd4WHvV/8lfKfUDUg==",
  "process-nextick-args@2.0.1":
    "sha512-3ouUOpQhtgrbOa17J7+uxOTpITYWaGP7/AhoR3+A+/1e9skrzelGi/dXzEYyvbxubEF6Wn2ypscTKiKJFFn1ag==",
  "readable-stream@2.3.8":
    "sha512-8p0AUk4XODgIewSi0l8Epjs+EVnWiK7NoDIEGU0HhE7+ZyY8D1IMY7odu5lRrFXGg71L15KG8QrPmum45RTtdA==",
  "safe-buffer@5.1.2":
    "sha512-Gd2UZBJDkXlY7GbJxfsE8/nvKkUEU1G38c1siN6QP6a9PT9MmHB8GnpscSmMJSoF8LOIrt8ud/wPtojys4G6+g==",
  "selenium-webdriver@4.49.0":
    "sha512-16XqeOEMj+4+p+pzLLyvNWmF5jCY05EKIl3e1anZBgv4+zq7PUTtiNjKtQhMpwosZ0wIMKDFAQ2xdyogOHD4DA==",
  "setimmediate@1.0.5":
    "sha512-MATJdZp8sLqDl/68LfQmbP8zKPLQNV6BIZoIgrscFDQ+RsvK/BxeDQOgyxKKoh0y/8h3BqVFnCqQ/gd+reiIXA==",
  "string_decoder@1.1.1":
    "sha512-n/ShnvDi6FHbbVfviro+WojiFzv+s8MPMHBczVePfUpDJLwoLT0ht1l4YwBCbi8pJAveEEdnkHyPyTP/mzRfwg==",
  "tmp@0.2.7":
    "sha512-e0votIpp4Uo2AJYSzVHV6xCcawuiez3DzqDAbrTc3YxBkplN6e+dM13ZeIcZnDg/QpSuU2zfZ3rzwY8ukEnaXw==",
  "util-deprecate@1.0.2":
    "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
  "ws@8.21.3":
    "sha512-201TZ/kPWxoPr/OKWjquZR1SWKXcvxdH+e1xrx89b3YbmzLMFCLfnaG1HFIgWzJOEWZ7MvpK++odZufgYR50Rw==",
} as const;

export const EXPECTED_RUNNER_SNAPSHOT_RELATIONSHIPS = {
  "@bazel/runfiles@6.5.0": {},
  "@playwright/test@1.63.0": { playwright: "1.63.0" },
  "core-util-is@1.0.3": {},
  "immediate@3.0.6": {},
  "inherits@2.0.4": {},
  "isarray@1.0.0": {},
  "jszip@3.10.2": {
    lie: "3.3.0",
    pako: "1.0.11",
    "readable-stream": "2.3.8",
    setimmediate: "1.0.5",
  },
  "lie@3.3.0": { immediate: "3.0.6" },
  "pako@1.0.11": {},
  "playwright-core@1.63.0": {},
  "playwright@1.63.0": { "playwright-core": "1.63.0" },
  "process-nextick-args@2.0.1": {},
  "readable-stream@2.3.8": {
    "core-util-is": "1.0.3",
    inherits: "2.0.4",
    isarray: "1.0.0",
    "process-nextick-args": "2.0.1",
    "safe-buffer": "5.1.2",
    string_decoder: "1.1.1",
    "util-deprecate": "1.0.2",
  },
  "safe-buffer@5.1.2": {},
  "selenium-webdriver@4.49.0": {
    "@bazel/runfiles": "6.5.0",
    jszip: "3.10.2",
    tmp: "0.2.7",
    ws: "8.21.3",
  },
  "setimmediate@1.0.5": {},
  "string_decoder@1.1.1": { "safe-buffer": "5.1.2" },
  "tmp@0.2.7": {},
  "util-deprecate@1.0.2": {},
  "ws@8.21.3": {},
} as const;

export const EXPECTED_RUNNER_INSTALLED_METADATA = {
  "@bazel/runfiles@6.5.0": { engines: null, license: "Apache-2.0" },
  "@playwright/test@1.63.0": { engines: ">=20", license: "Apache-2.0" },
  "core-util-is@1.0.3": { engines: null, license: "MIT" },
  "immediate@3.0.6": { engines: null, license: "MIT" },
  "inherits@2.0.4": { engines: null, license: "ISC" },
  "isarray@1.0.0": { engines: null, license: "MIT" },
  "jszip@3.10.2": { engines: null, license: "(MIT OR GPL-3.0-or-later)" },
  "lie@3.3.0": { engines: null, license: "MIT" },
  "pako@1.0.11": { engines: null, license: "(MIT AND Zlib)" },
  "playwright-core@1.63.0": { engines: ">=20", license: "Apache-2.0" },
  "playwright@1.63.0": { engines: ">=20", license: "Apache-2.0" },
  "process-nextick-args@2.0.1": { engines: null, license: "MIT" },
  "readable-stream@2.3.8": { engines: null, license: "MIT" },
  "safe-buffer@5.1.2": { engines: null, license: "MIT" },
  "selenium-webdriver@4.49.0": {
    engines: ">= 22.0.0",
    license: "Apache-2.0",
  },
  "setimmediate@1.0.5": { engines: null, license: "MIT" },
  "string_decoder@1.1.1": { engines: null, license: "MIT" },
  "tmp@0.2.7": { engines: ">=14.14", license: "MIT" },
  "util-deprecate@1.0.2": { engines: null, license: "MIT" },
  "ws@8.21.3": { engines: ">=10.0.0", license: "MIT" },
} as const;

export const FOREIGN_LOCKFILES = [
  "bun.lock",
  "bun.lockb",
  "deno.lock",
  "npm-shrinkwrap.json",
  "package-lock.json",
  "yarn.lock",
] as const;

export const INSTALL_LIFECYCLE_SCRIPTS = [
  "preinstall",
  "install",
  "postinstall",
] as const;

