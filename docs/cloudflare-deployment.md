# Deploy to Cloudflare from GitHub

Every push to `main` runs **Deploy to Cloudflare**. The workflow validates the app, builds its Vinext server and browser assets for Cloudflare Workers, and deploys Worker `algorithm-studio` to your custom hostname. You can also run it manually from Actions on `main`. Pull requests only validate; they never deploy or receive deployment secrets.

## One-time setup

1. Add your domain to the target Cloudflare account and activate its DNS zone. Choose an unused hostname such as `learn.example.com`; an existing CNAME or another Worker on that hostname must be resolved before attaching it. Cloudflare provisions the custom-domain DNS record and certificate.
2. Create a Cloudflare API token using the **Edit Cloudflare Workers** template, scoped to the intended account and domain's zone. It needs Workers deployment and custom-domain routing permissions (including Workers Scripts edit and Workers Routes edit). Use the account ID from the Cloudflare dashboard.
3. Open this repository's **Settings → Secrets and variables → Actions → New repository secret** and add:

   | Secret                  | Value                                                                            |
   | ----------------------- | -------------------------------------------------------------------------------- |
   | `CLOUDFLARE_API_TOKEN`  | Cloudflare API token, not your global API key                                    |
   | `CLOUDFLARE_ACCOUNT_ID` | Target Cloudflare account ID                                                     |
   | `CLOUDFLARE_DOMAIN`     | Exact hostname, e.g. `learn.example.com`; no `https://`, path, wildcard, or port |

4. Push to `main`, or open **Actions → Deploy to Cloudflare → Run workflow**, selecting `main`.

The workflow reports missing secret names without printing their values. Secrets are passed through environment variables. The domain is written only into the gitignored build configuration, and generated configuration is not uploaded as a GitHub artifact. The deployed hostname is naturally public in DNS and certificates; storing it as a secret keeps it out of tracked source. `workers.dev` and version-preview URLs are disabled.

## What runs

- Read-only GitHub token; checkout does not persist Git credentials.
- Node 24 and `npm ci`, using the committed lockfile.
- `npm run check`: algorithm/component tests and the ordinary Node build.
- `npm run build:cloudflare`: a separate Vite config with Vinext's RSC/SSR Workers integration.
- `node scripts/configure-cloudflare.mjs`: validates the secret hostname and attaches it as a Workers Custom Domain.
- `npm run deploy:cloudflare`: deploys the generated `dist/server/wrangler.json` using the API token and account ID.

Production deployment runs are serialized so they cannot deploy concurrently. GitHub may coalesce intermediate pending runs during a rapid series of pushes; the latest pending revision still deploys. The regular validation workflow also checks the Workers build and an unauthenticated deployment dry run.

## Verify locally without Cloudflare credentials

```bash
npm ci
npm run build:cloudflare
npm run deploy:cloudflare -- --dry-run
npm run preview:cloudflare
```

Open `http://127.0.0.1:5174/lessons/acid`. This runs the built Worker locally. Normal `npm run dev` continues to use the existing Node/Vite setup on port 5173. Both build targets use `dist/`, so rebuild the intended target before using its preview/start command.

If a deployment fails, inspect the workflow's failing step. Missing secrets require setup above; authentication errors require a valid token and account scope; custom-domain errors generally require an active zone or resolving a conflicting hostname. After fixing setup, rerun the workflow. Domain/certificate provisioning can take time after the first successful deployment.

References: [Vinext on Cloudflare](https://vinext.dev/docs/deploying/cloudflare), [Cloudflare custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).
