import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "next/link": fileURLToPath(
        new URL("./tests/components/LinkStub.jsx", import.meta.url),
      ),
      "next/navigation": fileURLToPath(
        new URL("./tests/components/NavigationStub.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/components/**/*.test.jsx"],
    maxWorkers: 2,
    // Keep the full navigation and visualization interactions within a practical
    // budget on developer machines running the local server at the same time.
    testTimeout: 10000,
  },
});
