/* Retired: project payment account configuration must not attach to generic
   .brand-editor forms (customer, sale, payment, task, print, and other editors).
   Verified account details remain in each project's branding record and are
   fetched by loadDemandContext only when generating a Demand Letter.
   Keep this asset as a no-op for existing build manifests and cached loaders. */
