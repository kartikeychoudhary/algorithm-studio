import { readFile, writeFile } from "node:fs/promises";

// Only the generated, gitignored config receives the deployment hostname.
// Never interpolate secrets into shell commands or print their values.
const domain = process.env.CLOUDFLARE_DOMAIN;
if (
  !domain ||
  domain.length > 253 ||
  !domain.includes(".") ||
  !domain
    .split(".")
    .every((label) =>
      /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label),
    )
) {
  throw new Error(
    "CLOUDFLARE_DOMAIN must be a hostname only, without a scheme, port, path, or wildcard.",
  );
}
const path = new URL("../dist/server/wrangler.json", import.meta.url);
const config = JSON.parse(await readFile(path, "utf8"));
config.routes = [{ pattern: domain, custom_domain: true }];
config.workers_dev = false;
config.preview_urls = false;
await writeFile(path, JSON.stringify(config, null, 2) + "\n");
console.log("Custom domain configured in the generated Workers build.");
