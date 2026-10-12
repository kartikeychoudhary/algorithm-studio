import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  copyFile,
  writeFile,
  readFile,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("Cloudflare domain configuration validates secrets and preserves the built entry and assets", async () => {
  const root = await mkdtemp(join(tmpdir(), "algorithm-cloudflare-"));
  try {
    await mkdir(join(root, "scripts"));
    await mkdir(join(root, "dist/server"), { recursive: true });
    const script = join(root, "scripts/configure-cloudflare.mjs");
    await copyFile(
      new URL("../scripts/configure-cloudflare.mjs", import.meta.url),
      script,
    );
    const path = join(root, "dist/server/wrangler.json");
    const original = { main: "index.js", assets: { directory: "../client" } };
    await writeFile(path, JSON.stringify(original));
    for (const value of [
      "",
      "https://example.com",
      "example.com/path",
      "*.example.com",
      "example.com:443",
      "bad\n.example.com",
      "-bad.example.com",
      "a".repeat(64) + ".com",
    ]) {
      const result = spawnSync(process.execPath, [script], {
        env: { ...process.env, CLOUDFLARE_DOMAIN: value },
        encoding: "utf8",
      });
      assert.notEqual(result.status, 0);
      assert.deepEqual(JSON.parse(await readFile(path, "utf8")), original);
    }
    const domain = "learn.example.com";
    const result = spawnSync(process.execPath, [script], {
      env: { ...process.env, CLOUDFLARE_DOMAIN: domain },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(!result.stdout.includes(domain));
    assert.deepEqual(JSON.parse(await readFile(path, "utf8")), {
      ...original,
      routes: [{ pattern: domain, custom_domain: true }],
      workers_dev: false,
      preview_urls: false,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
