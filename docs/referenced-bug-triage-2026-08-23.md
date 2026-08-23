# Referenced Crowd-Testing Bug Triage

**Source:** User-referenced task `LPjbHRkenD1QAkeRya3Lh0`, test report dated 23 August 2026. The referenced report used a tester account and synthetic records; no credentials, user identifiers, or evidence payloads are copied into this project document.

## Triage principle

The referenced report is a useful test input, not proof that the current staging or Production code still has the same behavior. Each finding must be reproduced against the isolated staging environment before it is classified as confirmed or fixed. Authenticated, financial, and evidence workflows require staging-only purpose-made fixtures and explicit approval before any state-changing test.

## Reported findings awaiting current-state verification

| ID | Reported severity | Area | Current triage state |
|---|---|---|---|
| BUG-001 | High | Anonymous `/workspace` blank page | Pending unauthenticated staging reproduction |
| BUG-002 | High | Post-login blank workspace before onboarding resolution | Requires approved staging fixture |
| BUG-003 | High | Onboarding success does not transition to workspace | Requires approved staging fixture |
| BUG-004 | Medium | Reports and Wallet navigation does not visibly reach targets | Requires approved staging fixture |
| BUG-005 | Medium | Footer policy items are non-interactive | Pending public staging reproduction |
| BUG-006 | Medium | Bug-report dialog permits an unusable no-cycle submission path | Requires approved staging fixture |
| BUG-007 | Medium | Withdrawal dialog lacks a clear zero-balance guardrail | Requires approved staging fixture |
| BUG-008 | Medium | Dialogs lack accessible descriptions | Requires approved staging fixture |
| BUG-009 | Medium | Evidence file input lacks an accessible name | Requires approved staging fixture |
| BUG-010 | Low | Arabic sign-in renders an English authentication error | Can be verified with a synthetic non-account request |
| BUG-011 | Low | `bank transfer` payout option lacks consistent localization | Requires approved staging fixture |

## Scope and release control

The corrective work will remain on the `staging` branch and use the isolated staging Supabase/Vercel Preview environment. No Production setting, deployment, database record, domain, or Manus deployment will be changed without a separate reviewed recommendation and the user’s explicit approval.

## Implemented remediation and evidence

The current implementation has been updated on the staging worktree. These changes are source-reviewed and locally regression-tested; they are not a substitute for a controlled authenticated staging acceptance test.

| IDs | Implemented correction | Evidence and remaining limit |
|---|---|---|
| BUG-001, BUG-002, BUG-003 | Workspace now has explicit loading, anonymous access, onboarding-required, and recoverable profile-error states. The onboarding mutation refreshes the profile cache before navigating. | A local browser probe confirms the anonymous workspace route renders a named sign-in gate, not a blank page. An authenticated staging fixture is still required for full post-login and onboarding verification. |
| BUG-004 | Sidebar hash navigation now scrolls the identified target into view, and Reports, Wallet, Projects, Decisions, Payouts, and Integrity have explicit target IDs. | Source regression coverage verifies the scroll behavior is wired. Authenticated navigation still requires a staging fixture for end-to-end verification. |
| BUG-005 | The public footer now links to an accessible `/policies` page with privacy, terms, and evidence sections. | A local browser probe clicked the privacy link and verified `/policies#privacy` rendered the matching section. |
| BUG-006, BUG-007 | The report dialog gives a clear no-active-cycle state; the withdrawal dialog gives a zero-available-balance state and prevents invalid amounts. | Source regression coverage verifies both guards. A tester fixture with controlled cycles and balance is required to verify server responses and transactional effects. |
| BUG-008, BUG-009 | Operational dialogs now include accessible descriptions, and the evidence control has an explicit accessible name and help text. | Source regression coverage confirms the required dialog and input accessibility attributes are present. |
| BUG-010, BUG-011 | Known Supabase login failures are localized to Arabic, and the bank-transfer payout label now reads `تحويل بنكي (Bank transfer)`. | Source regression coverage confirms the localized strings. The login error is not submitted against a real account. |

The automated suite completed with **27 passing tests and 1 intentional opt-in database integration skip**. The production build completed successfully. The client bundle remains above Vite's 500 kB advisory threshold, which is pre-existing performance debt and not treated as a release-blocking test failure in this pass.

## Remaining acceptance gate

Before a Production recommendation, create purpose-made staging-only tester, client, and admin fixtures with explicit user approval. Use them to validate role transitions, no-cycle and zero-balance server responses, evidence authorization, triage decisions, payout concurrency, direct RLS denial, and cleanup. No Production deployment is authorized by this document.
