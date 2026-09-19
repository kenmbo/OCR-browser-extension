import { readFile } from "node:fs/promises";
import path from "node:path";

import { repositoryRootFromMeta, runCheck } from "./foundation/cli.ts";
import {
  readJsonRecord,
  validateLockfileSource,
} from "./foundation/validation.ts";

const root = repositoryRootFromMeta(import.meta.url);

await runCheck("lockfile", async () => {
  const [packageJson, lockfile] = await Promise.all([
    readJsonRecord(path.join(root, "package.json")),
    readFile(path.join(root, "pnpm-lock.yaml"), "utf8"),
  ]);
  return validateLockfileSource(lockfile, packageJson);
});

