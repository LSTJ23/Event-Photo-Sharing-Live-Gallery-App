import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/..." shortcut the app uses (see tsconfig.json).
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // Plain logic tests run in Node. Component tests opt in to a browser-like
    // DOM with "// @vitest-environment jsdom" on their first line.
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"]
  }
});
