# Test Mode

Use **Open Test Mode** at the top of the CRM. It is tab-specific and persists
across refreshes. **Exit Test Mode** reloads the live workspace with the same login.

The shared demo workspace starts with TEST-001 / Demo Customer — TEST ONLY,
AED 1,000,000 sale value, AED 200,000 Down Payment with AED 10,000 received,
AED 40,000 DLD plus AED 5,000 example admin fees, and a 40/60 payment plan.
TEST-002 through TEST-005 are available for booking tests. Normal CRM/manager
permissions apply; managers must enter Test Mode to review test approvals.

**Reset Demo** clears all test records for everyone and restores the initial
scenario. A confirmation is required. Only CRM officers can reset. Identity
sequences are not restarted, protecting against stale task IDs in another tab.

## Isolation

`crm_test` has independent tables, sequences, foreign keys, views, RPCs and
triggers. `crm_test_private` is not exposed through the Data API. Business data
is never copied from live. Profiles (for actual user permissions) and branding
are the only copied reference data. Test routine ownership uses a NOLOGIN role
without write permissions on live tables. RLS and explicit grants remain active.

The frontend forces every Data API request in Test Mode to `crm_test`, including
explicit `.schema('public')` or raw fetch calls. Switching reloads the application,
with separate operational caches. Test Mode must NEVER fall back to a live RPC.

Emails, contact shortcuts, Edge Functions and stored-file access are disabled.
Document previews/downloads use local PDF generation and are marked TEST ONLY.
SPA reference files work locally; private uploaded plans/templates are not copied.

## Keeping future releases testable

Both modes load the same deployed UI. On entering/resetting Test Mode, compatible
workflow functions and triggers refresh from the current live definitions into
the isolated schemas. The refresh is private and executable only by the bounded
initializer. It rewrites all business references, retains role checks and assigns
the isolated routine owner. External-service schemas are rejected.

If a migration changes table shape, the refresh fails closed with an update
message. The same release MUST migrate the corresponding test table, constraints,
indexes, views, policies and grants as appropriate. Never resolve drift by reading
or writing production data. Review new external integrations explicitly.

Run `tests/test-mode.database.sql` in a rollback transaction after database
changes and the browser test at mobile/desktop widths. Payment/SPA database tests
can be run with public business references changed to crm_test after preparing the
workspace, also inside a rollback transaction. Verify live row hashes are unchanged.
