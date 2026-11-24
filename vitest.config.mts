import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // "server-only" throws outside a React Server environment; tests import server modules directly.
    alias: { "server-only": new URL("./src/test/empty.ts", import.meta.url).pathname },
  },
});
