# Building Sunbliss CRM

## Normal build

```bash
npm run build
```

The production build is deterministic and network-free. It copies the frozen bootstrap files from `vendor/base/`, replaces the authentication chunk with `auth_core_replacement.js`, and then applies the local patch files in the order defined by `build.js`.

A fresh clone should be able to build without contacting any previous Vercel deployment.

## Refreshing the frozen bootstrap

Refreshing the bootstrap is a maintenance operation, not part of deployment:

```bash
npm run vendor:base
npm run build
```

To snapshot a different explicitly approved source deployment:

```bash
CRM_BASE_URL=https://example.vercel.app npm run vendor:base
npm run build
```

Review `vendor/base/manifest.json` and the generated application before committing a refreshed snapshot. The manifest records file sizes and SHA-256 hashes so changes to the frozen base are visible in code review.

Do not add remote downloads back to `build.js`; production deployments must build from repository contents only.
