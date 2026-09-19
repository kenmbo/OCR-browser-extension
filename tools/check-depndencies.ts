import { readFile } from "node:fs/promises";
import path from "node:path";

import { repositoryRootFromMeta, runCheck } from "./foundation/cli.ts";
import {
  collectInstalledPackages,
  readJsonRecord,
  readWorkspacePolicy,
  validateInstalledDependencies,
  validateLockfileSource,
  validateWorkspacePolicy,
} from "./foundation/validation.ts";

const root = repositoryRootFromMeta(import.meta.url);

await runCheck("dependencies", async () => {
  const [installed, workspace, packageJson, lockfile] = await Promise.all([
    collectInstalledPackages(root),
    readWorkspacePolicy(root),
    readJsonRecord(path.join(root, "package.json")),
    readFile(path.join(root, "pnpm-lock.yaml"), "utf8"),
  ]);
  validateWorkspacePolicy(workspace);
  const lockfileReport = validateLockfileSource(lockfile, packageJson);
  return {
    ...validateInstalledDependencies(installed, workspace),
    lockedPackageCount: lockfileReport.packageCount,
  };
});

