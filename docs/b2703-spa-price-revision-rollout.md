# B2-703 SPA price revision - staging rollout

Status: Live phase 1: read-only price-revision metadata, approved-pending installment allocations, and Accounts-clearance visibility. No supplementary credit notes issued. Subsequent collection-engine integration remains gated.

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
2. Live phase 1: apply additive, read-only tables with RLS to Supabase after verifying current schema and existing records. No existing records altered.
3. Verify signed SPA and the internally authorized official CRM communication as the management approval reference. A separate approval letter is not required under the confirmed internal CRM workflow. Legal/Accounts review of registration, concessions and applicable DLD treatment remains a separate safeguard.
4. Live phase 1: record the signed SPA and seven approved-pending credit allocations. Verify the second installment remains Awaiting Accounts Clearance and no notes are issued.
5. Integrate the gross SPA amounts, issued credits, pending approved credits, actual cash and collection obligations across scheduled payments, automatic reminders, SOA, unit summary and exports.
6. After updating schedule gross to the signed SPA amounts in TEST DB, issue one supplementary note through the atomic issuance function. Verify that exactly one credit note and one Send Credit Note task exist, and retries do not duplicate.
7. Deploy B2-703-only read-only Price Revision & Settlement view in the customer action menu. Keep all credit-note issuance disabled.
8. Verify payment receipts and due/revised dates unchanged; test already-settled and future installments. Email History must only record verified sent/received correspondence.
9. Validate DLD AED 2,360, non-duplicated referral credit, management visibility, cash/credit ledger discrepancies, responsive layout and rollback.
10. Before phase 2, complete financial-engine integration and separate authorization for any actual issued credit note or existing payment-ledger amendment.

## Current delivery
- GitHub staging branch contains RLS-protected DB migration, atomic credit-note RPC, deterministic financial engine, tests, gated read-only UI preview and build integration.
- No CRM live data updated, and no production branch changes.
- Schema rollout, full task/statement integration, end-to-end QA and actual production go-live are not yet complete.