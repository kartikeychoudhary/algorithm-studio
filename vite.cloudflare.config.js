import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

// Keep the ordinary Node.js/local build separate from the Workers runtime.
export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      configPath: "wrangler.cloudflare.json",
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
