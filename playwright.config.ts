// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    executablePath: process.env.CHROME_BIN || '/opt/chrome-linux64-stable/chrome',
    headless: false
  }
});
