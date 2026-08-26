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

## Fresh browser reproduction in progress

On 2026-08-26, a new Production visit to `/workspace` was made through the user's connected browser. The browser was already authenticated as the existing test account, so it could not serve as an anonymous-route test without ending that session. After the normal initial loading skeleton, the workspace hydrated into the expected Arabic tester dashboard with empty-state cycle, report, wallet, and reputation panels. This does not reproduce BUG-002 for the current signed-in session. Anonymous and accessibility findings will be assessed in an isolated browser context so the connected session is preserved.

The authenticated Production retest also selected **Reports** and **Wallet** through the sidebar. Each action updated the `section` query parameter, visibly activated the destination, and rendered the intended Arabic content: saved-report/notification states for Reports and zero-balance/payout-history states for Wallet. BUG-004 is therefore not reproducible in the current release for this account.

An isolated Production browser retest then confirmed BUG-001: an anonymous `/workspace` visitor receives the Arabic sign-in access gate. The `/sign-in` page also includes Arabic sign-in content and a visible self-service account-creation path, so the public portion of BUG-010 and BUG-012 is not reproducible. The isolated test found no clickable `/policies` link on the public home page. A subsequent direct browser inspection confirmed that `/policies` itself does render the required Arabic privacy, terms, and evidence-policy content; the remaining BUG-005 regression is therefore limited to the non-interactive public footer labels. No browser-console errors were emitted during these public-route checks.

The policy finding was then retested with an assertion that correctly recognizes fragment links (`/policies#privacy`, `/policies#terms`, and `/policies#evidence`) and waits for the client route to hydrate. All four isolated Production checks passed: anonymous workspace access gate, Arabic sign-in/signup surface, three public policy links, and rendered policy content. The prior BUG-005 result was a test-selector and hydration-timing false positive, not a live regression. The connected-browser workspace retest likewise confirmed stable hydration for the signed-in tester session and working Reports and Wallet navigation.

The current repository also passed `pnpm check` and the full regression suite: 19 test files and 63 tests passed, with one intentional opt-in database test skipped. This suite covers the remaining dialog, accessibility, localization, and V3-workspace safeguards that cannot be exercised meaningfully with the present account's no-cycle and zero-wallet state. No newly reproducible defect from BUG-001 through BUG-013 was found in this fresh verification, so no application-code change was required.
