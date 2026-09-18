export interface RuntimeIdentityPort {
  getExtensionId(): string;
  getExtensionUrl(path: string): string;
}

