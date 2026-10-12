# Dependency notes

The project uses Vinext 1.1.0. The lockfile records the exact dependency versions validated by the tests and build.

The `fflate` override selects the patched 0.8.x release for the transitive image-rendering dependency.

As of 2026-10-11, `npm audit` reports six high-severity entries from one upstream advisory: [braces stack exhaustion (GHSA-vfj7-8cjw-p6xm)](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). The affected chain is Vinext → vite-plugin-commonjs → vite-plugin-dynamic-import → fast-glob → micromatch → braces. The latest published braces version is still 3.0.3, which the advisory marks affected.

These dependencies process build-time glob patterns; the app does not expose glob-pattern input. There is no patched braces release available in the registry at the time of validation. Recheck when upgrading Vinext. Do not use `npm audit fix --force` blindly: its proposed Vinext downgrade crosses a major version and does not preserve the validated stack.

The local development and production scripts bind to 127.0.0.1. Public deployment uses a separate Cloudflare Workers build through GitHub Actions; see the [deployment setup guide](cloudflare-deployment.md).
