import path from "node:path";

import { repositoryRootFromMeta, runCheck } from "./foundation/cli.ts";
import {
  readJsonRecord,
  readWorkspacePolicy,
  validateToolchain,
} from "./foundation/validation.ts";

const root = repositoryRootFromMeta(import.meta.url);

await runCheck("toolchain", async () => {
  const [packageJson, workspace] = await Promise.all([
    readJsonRecord(path.join(root, "package.json")),
    readWorkspacePolicy(root),
  ]);
  await validateToolchain(root, packageJson, workspace);
  return { node: process.version, pnpm: "12.3.4" };
});

