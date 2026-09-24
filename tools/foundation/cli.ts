import { fileURLToPath } from "node:url";
import path from "node:path";

export function repositoryRootFromMeta(
  importMetaUrl: string,
  args: readonly string[] = process.argv.slice(2),
): string {
  const normalizedArgs = args[0] === "--" ? args.slice(1) : args;
  if (normalizedArgs.length === 0) {
    return fileURLToPath(new URL("../", importMetaUrl));
  }
  if (
    normalizedArgs.length === 2 &&
    normalizedArgs[0] === "--root" &&
    normalizedArgs[1] !== undefined
  ) {
    return path.resolve(normalizedArgs[1]);
  }
  throw new Error("usage: checker [--root <repository-root>]");
}

export async function runCheck(
  label: string,
  check: () => Promise<unknown>,
): Promise<void> {
  try {
    const report = await check();
    const suffix = report === undefined ? "" : ` ${JSON.stringify(report)}`;
    process.stdout.write(`${label}: ok${suffix}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${label}: failed\n${message}\n`);
    process.exitCode = 1;
  }
}

