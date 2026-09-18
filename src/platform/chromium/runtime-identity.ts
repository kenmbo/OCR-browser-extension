import type { RuntimeIdentityPort } from "../../shared/ports/runtime-identity.ts";

export const chromiumRuntimeIdentity: RuntimeIdentityPort = {
  getExtensionId(): string {
    return chrome.runtime.id;
  },
  getExtensionUrl(path: string): string {
    return chrome.runtime.getURL(path);
  },
};

