# Referenced Main-Branch QA Findings

**Source:** User-attached testing session `LPjbHRkenD1QAkeRya3Lh0` (“main branch testing”).  
**Scope:** This is a non-secret remediation inventory. The findings must be revalidated against the current synchronized `main`/`staging` code before a fix is claimed, because several UI fixes were completed after the referenced test run.

| ID | Reported finding | Original severity |
|---|---|---|
| BUG-001 | Anonymous `/workspace` rendered a blank page rather than a login/access state. | High |
| BUG-002 | A valid login could initially display an incomplete or blank workspace. | High |
| BUG-003 | Successful onboarding could remain on the onboarding page and reset the form. | High |
| BUG-004 | Reports and Wallet navigation changed the hash without scrolling or visibly activating the destination. | Medium |
| BUG-005 | Footer privacy, terms, and evidence-policy labels were non-interactive. | Medium |
| BUG-006 | The report dialog exposed an enabled-looking no-cycle submission path and incomplete required semantics. | Medium |
| BUG-007 | The withdrawal dialog exposed an enabled-looking request path at a zero balance. | Medium |
| BUG-008 | Report and withdrawal dialogs had missing accessible descriptions. | Medium |
| BUG-009 | The evidence file input lacked an accessible label. | Medium |
| BUG-010 | Arabic sign-in displayed an English authentication error. | Low |
| BUG-011 | The payout method `bank transfer` was inconsistently localized. | Low |
| BUG-012 | Sign-in messaging contradicted the visible self-service account creation path. | Low |
| BUG-013 | Authenticated tRPC errors exposed raw SQL, schema/procedure details, and a tester identifier; the assigned-cycle/dashboard queries also delayed workspace hydration. | Medium |

The reference also reported a likely production database-schema mismatch in V3 `test_cycle_applications` and `test_cycle_ttls` queries. Diagnosis must distinguish a live migration/state issue from code defects, and remediation must not change Production provider settings or data without explicit approval.

## Read-only migration diagnosis

On 2026-08-26, the connected Supabase projects were inspected without viewing credentials or changing data. The staging project contains the `v3_test_cycle_workflow` and `v3_1_payout_transfer_tracking` migrations. The Production project contains only its initial-schema, default-deny, and index migrations; it does **not** contain either V3 migration. This confirms that the reported Production missing-table errors are caused by a database migration gap, not a client-side credential issue.

The source mitigation makes only missing V3-table reads fall back safely and converts unexpected server failures to a generic Arabic message; it does not mask other database failures.

## Approved Production remediation and verification

After explicit user approval on 2026-08-26, the Production schema was rechecked to confirm that the V3 tables were absent while the baseline tables were present. The existing `v3_test_cycle_workflow` migration and its dependent `v3_1_payout_transfer_tracking` migration were then applied in dependency order. Both provider operations completed successfully.

A post-migration, read-only table check confirmed the presence of `test_cycle_applications`, `test_cycle_invitations`, `test_cycle_ttls`, and `bug_report_events`; all four have row-level security enabled. No credentials or user-record values were viewed or changed during this validation.

The staging remediation was merged to `main` as commit `3b0dcfd` (`Merge V3 schema resilience remediation`). Vercel reported that commit as **Ready** in the **Production** environment, and the public `/api/health` endpoint returned `{"configured":true,"ok":true,"service":"mizan-al-jawda"}` after deployment. An authenticated end-to-end workflow was not rerun because no authenticated test session was available; the schema and deployment checks confirm that the original missing-table failure condition has been removed.
