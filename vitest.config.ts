import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/**", "src/services/**"],
    },
    // Separate unit and integration suites so integration tests can be
    // skipped when no DATABASE_URL is available.
    include: ["tests/**/*.test.ts"],
  },
});
