import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
          name: "unit-node",
        },
      },
    ],
  },
});

