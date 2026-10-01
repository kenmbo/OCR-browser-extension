import type { ReviewedSigningKeyIdentity } from "./reviewed-key-policy.ts";

export const PREPARATION_PLAN_SCHEMA_VERSION = 1 as const;
export const PREPARATION_PLAN_REVISION =
  "m2-browser-preparation-plan-r4" as const;
export const PREPARATION_POLICY_REVISION =
  "m2-browser-preparation-policy-r4" as const;
export const GENERATION_ID_DOMAIN_SEPARATOR =
  "local-tesseract-ocr:m2-browser-preparation-generation:v1\0" as const;

export const PREPARATION_PLAN_LIMITS = {
  maxArrayLength: 256,
  maxDepth: 12,
  maxNodes: 2048,
  maxOperations: 128,
  maxOwnProperties: 32,
  maxStringBytes: 2048,
  maxTraversedProperties: 8192,
} as const;

export const PREPARATION_TRANSFER_CEILINGS = {
  "chrome-for-testing-browser-archive": 160 * 1024 * 1024,
  "compressed-package-index": 64 * 1024 * 1024,
  "driver-archive": 16 * 1024 * 1024,
  "firefox-browser-archive": 256 * 1024 * 1024,
  "reviewed-public-key": 128 * 1024,
  "signed-metadata": 64 * 1024 * 1024,
} as const;

export type PreparationRoleClass =
  | "reviewed-public-key"
  | "signed-metadata"
  | "compressed-package-index"
  | "firefox-browser-archive"
  | "chrome-for-testing-browser-archive"
  | "driver-archive";

export type PreparationVerificationKind =
  | "debian-inrelease-openpgp"
  | "debian-release-sha256"
  | "github-release-platform-sha256"
  | "mozilla-openpgp"
  | "mozilla-signed-checksum-sha256"
  | "vendor-observation-sha256";

export type PreparationTerminalPolicy =
  | { readonly kind: "direct" }
  | {
      readonly finalUrl: string;
      readonly kind: "debian-snapshot-object";
      readonly opaqueContentAddress: string;
    }
  | {
      readonly assetId: 483347579;
      readonly assetName: "geckodriver-v0.37.1-linux64.tar.gz";
      readonly kind: "geckodriver-github-release-asset";
      readonly owner: "mozilla";
      readonly releaseId: 356643350;
      readonly repository: "geckodriver";
      readonly tag: "v0.37.1";
    };

export interface PreparationDestination {
  readonly path: string;
  readonly role: "downloads" | "metadata" | "trust";
}

export interface PreparationOperation {
  readonly destination: PreparationDestination;
  readonly expectedByteSize: number;
  readonly expectedSha256: string;
  readonly inputId: string;
  readonly operationId: string;
  readonly roleClass: PreparationRoleClass;
  readonly sourceUrl: string;
  readonly terminalPolicy: PreparationTerminalPolicy;
  readonly vendorIdentity: PreparationVendorIdentity;
  readonly verificationKind: PreparationVerificationKind;
}


export interface PreparationPlan {
  readonly architecture: "x86_64";
  readonly operations: readonly PreparationOperation[];
  readonly planRevision: typeof PREPARATION_PLAN_REVISION;
  readonly platform: "linux";
  readonly preparationPolicyRevision: typeof PREPARATION_POLICY_REVISION;
  readonly schemaVersion: typeof PREPARATION_PLAN_SCHEMA_VERSION;
}

