import { repositoryRootFromMeta, runCheck } from "./foundation/cli.ts";
import {
  collectInstalledPackages,
  validateLicenses,
} from "./foundation/validation.ts";

const root = repositoryRootFromMeta(import.meta.url);

await runCheck("licenses", async () => {
  const installed = await collectInstalledPackages(root);
  return validateLicenses(installed);
});

