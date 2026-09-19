import { repositoryRootFromMeta, runCheck } from "./foundation/cli.ts";
import { validateSourceBoundaries } from "./source-boundaries/validation.ts";

const root = repositoryRootFromMeta(import.meta.url);

await runCheck("imports", async () => validateSourceBoundaries(root));

