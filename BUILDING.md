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

## Triana project

The final build stage generates `dist/triana.html`, its bundles and its document
editors from the completed Sunbliss build. It changes project identity and
resource routing only; no separate screen source is maintained. The shared
project selector remains outside the asynchronously rebuilt header.

`project_bootstrap.js` runs before the Supabase client, pins every REST request
to `crm_triana` (or `crm_triana_test`), namespaces operational caches, and retains
shared login. Project switching performs a full page load. The SQL provisioner
is `supabase/triana_shared_engine.sql`; it was applied remotely as migration
`triana_shared_crm_engine`. Never rerun the creation script on existing schemas.
Compatible workflow functions refresh from the shared public engine on entry;
schema shape changes must migrate all project/test schemas in the same release.

Run the normal build, then `node --test tests/project-isolation.test.js
tests/project-selector-persistence.test.js`. Run
`tests/triana-shared-engine.database.sql` for rollback-only booking and SPA
workflow integration checks. Test customer data must not remain after tests.

Triana's SPA template and storage assets require separate provisioning. Until
then the shared SPA editor reports that requirement instead of producing a
Sunbliss agreement. Local payment receipts, welcome letters and SOAs use the
same document layout with Triana identity and the TPRED receipt prefix.
