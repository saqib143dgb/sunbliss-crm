# CRM development requirements

The application has live and isolated Test Mode workspaces. Read TEST_MODE.md
before changing database schema, authentication, network clients, document export,
workflow RPCs, storage or external integrations. Keep both modes functional in the
same release. A change must never make Test Mode fall back to production data.
