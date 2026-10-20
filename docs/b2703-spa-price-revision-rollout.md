# B2-703 SPA price revision - staging rollout

Status: NOT DEPLOYED. Separate signed production approval required.

## Verified baseline
- Sale ID 47, unit ID 467, unit B2-703.
- Signed SPA reported by user: AED 2,002,000. Actual CRM spa_status still Pending; evidence must be verified before amending.
- Commercial sale price AED 1,876,000; original unit total AED 1,943,000.
- Issued CN #37 DP AED 6,700; #38 first installment AED 118,590 (AED 60,300 price adjustment + AED 58,290 referral bonus); #39 DLD AED 2,680.
- Existing property cash received AED 360,460. Existing DLD cash paid AED 80,140.
- Never count AED 58,290 referral bonus twice.

## Approved new SPA allocation (AED)
| Schedule ID | Stage | SPA gross | Supplementary credit | Expected installment cash |
|---|---|---:|---:|---:|
|1200|Down Payment|200,200|5,900|187,600|
|1199|First|200,200|5,900|75,710|
|1205|Second|100,100|2,950|97,150|
|1204|Third|100,100|2,950|97,150|
|1203|Fourth|100,100|2,950|97,150|
|1202|Fifth|100,100|2,950|97,150|
|1201|Final Handover|1,201,200|35,400|1,165,800|

Total SPA AED 2,002,000. Additional credits AED 59,000; existing property credits AED 125,290 including referral. Net property cash AED 1,817,710; outstanding expected property cash AED 1,457,250.
DLD: AED 80,080 + admin AED 5,100 - paid AED 80,140 - existing CN AED 2,680 = AED 2,360 additional payable.

## Implementation gates
1. Snapshot/backup B2-703 unit, sale, all transactions, schedule dates, issued notes, email history and tasks. Preserve historical records.
2. Deploy new tables and RLS to a SEPARATE TEST SUPABASE PROJECT only. Do NOT apply staging migration to the live Sunbliss CRM.
3. Confirm signed SPA, management approval reference and legal/Accounts acceptance of commercial consideration, concessions, DLD and residency/registration disclosures.
4. In isolated test DB, add one signed SPA price revision and seven approved installment allocations. No migration seed is included: never seed live customer data automatically.
5. Integrate the gross SPA amounts, issued credits, pending approved credits, actual cash and collection obligations across scheduled payments, automatic reminders, SOA, unit summary and exports.
6. After updating schedule gross to the signed SPA amounts in TEST DB, issue one supplementary note through the atomic issuance function. Verify that exactly one credit note and one Send Credit Note task exist, and retries do not duplicate.
7. Review gated UI in a test build by setting window.__sunblissEnablePriceRevisionStaging=true before UI bundle startup. This screen remains read-only.
8. Verify payment receipts and due/revised dates unchanged; test already-settled and future installments. Email History must only record verified sent/received correspondence.
9. Validate DLD AED 2,360, non-duplicated referral credit, management visibility, cash/credit ledger discrepancies, responsive layout and rollback.
10. Obtain production go/no-go separately; only then plan the migration and CRM production deployment.

## Current delivery
- GitHub staging branch contains RLS-protected DB migration, atomic credit-note RPC, deterministic financial engine, tests, gated read-only UI preview and build integration.
- No CRM live data updated, and no production branch changes.
- Schema rollout, full task/statement integration, end-to-end QA and actual production go-live are not yet complete.