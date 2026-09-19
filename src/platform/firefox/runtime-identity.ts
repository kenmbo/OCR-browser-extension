import type { RuntimeIdentityPort } from "../../shared/ports/runtime-identity.ts";

export const firefoxRuntimeIdentity: RuntimeIdentityPort = {
  getExtensionId(): string {
    return browser.runtime.id;
  },
  getExtensionUrl(path: string): string {
    return browser.runtime.getURL(path);
  },
};

