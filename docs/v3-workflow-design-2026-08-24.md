# V3 Workflow Design — 24 August 2026

## Baseline observed

The current server trusts the persisted `profiles.role` value resolved after validating a Supabase access token server-side. Browser user metadata does not carry application roles. This is the correct foundation for preventing a user from forging a Community Manager identity in the interface.

However, the current data model has only `user`, `tester`, `client`, and `admin` roles. All active test cycles are shown to every tester, and the report-submission procedure verifies only tester role, owned device, and active-cycle dates. It does **not** require an accepted application. Bug reports also use a multi-stage status model (`submitted`, `triaged`, `approved`, and related states), while V3 requires the product-facing status to be exactly **pending**, **accepted**, or **rejected**.

The tester sidebar currently relies on `/workspace#reports` and `/workspace#wallet` hash scrolling. This is why the menu does not provide a distinct rendered view or reliable active state for `تقاريري` and `المحفظة`.

## V3 authorization model

| Capability | Persisted authority | Server enforcement |
| --- | --- | --- |
| Submit a report | Tester with an **accepted** application for that active cycle | Verify tester role, device ownership, active dates, and application status inside the report transaction. |
| Review a report | TTL assigned to the report’s test cycle | Verify an active record in the cycle-TTL assignment table; browser state is never trusted. |
| Accept/reject a cycle application | Business Owner of the project or a TTL assigned to that cycle | Verify project ownership or cycle-specific TTL assignment. |
| Invite a tester to apply | Business Owner of the project | Verify project ownership and that the target is an existing completed tester. |
| Assign a TTL | Community Manager | Verify a persisted `community_manager` role and require the target account to be a tester. |
| Make/remove a Community Manager | Platform administrator only | Do not expose any self-service role promotion; an existing persisted administrator must authorize it. |

TTL is deliberately modelled as a **per-test-cycle assignment**, not as a global browser-selectable role. A tester receives a visible TTL badge only where they are assigned, and gains no review authority for another cycle.

## Status and decision model

The V3 `bug_reports.status` column will expose only `pending`, `accepted`, or `rejected`.

| Reviewer action | Stored report status | Event history | Tester email / in-app notification |
| --- | --- | --- | --- |
| Submit report | `pending` | `submitted` | Not required by V3. |
| Ask for more information | remains `pending` | `information_requested` with required explanation | Required. |
| Accept | `accepted` | `accepted` | Required. |
| Reject | `rejected` | `rejected` with required explanation | Required. |

A separate immutable report-event history will preserve the information-request explanation without inventing a fourth report status. Accepted reports will keep the current financial settlement safeguards, adapted to the TTL acceptance point so the business owner can view accepted reports without creating a duplicate payout decision.

## Test-cycle participation model

V3 will add separate invitation and application records. An invitation asks a registered tester to apply; it does not itself grant test access. Testers may apply to active cycles, with invitations highlighted in their dashboard. Only an application approved by a Business Owner or an assigned TTL grants report-submission access.

## Notifications

The existing `notifications` table supports in-app delivery only. No user-email provider is currently configured. The implementation will add a server-side mail adapter for Resend, using only `RESEND_API_KEY` and `EMAIL_FROM` server environment variables. It will record the in-app notification regardless; email delivery will be tested once a verified Resend sender and credentials are configured for Vercel. No browser-side key, `VITE_` variable, or secret will be introduced.

On 24 August 2026, an authenticated Resend Free account was opened through the connected browser and an API credential was generated. The credential was transferred only through the browser clipboard into Vercel’s **staging/Preview** environment and restricted to the `staging` branch. The companion `EMAIL_FROM` setting is likewise staging-only. Neither value was copied into source control, documentation, browser-visible message text, or a `VITE_` variable.

Resend’s default onboarding sender is suitable only for account-owner testing. A verified sending domain remains required before enabling arbitrary-recipient tester notifications in Production; therefore no mail setting has been added to Vercel Production.

## Navigation repair

The tester workspace will move from unreliable hash-only menu behavior to explicit workspace sections backed by a section query parameter, while preserving `/workspace` as the overview. The reports view will render saved report details, status, and latest review feedback; the wallet view will render balance and payout controls directly.

## Staging release record

The V3 source, migration, tests, and this implementation record were committed to the isolated `staging` branch as `c751957` (`feat: add V3 test-cycle workflow controls`). Vercel created a Preview deployment for that commit. Its first dashboard observations showed it building; Production remained on its existing migration-branch deployment and was not changed.

The Preview became Ready in 57 seconds at `https://mizan-al-jawda-crowd-testing-git-staging-youssef-soliman.vercel.app`. An initial read-only visit to `/workspace` showed the workspace loading skeleton; a follow-up check is required before judging the completed interface.

The follow-up V3 commit `463a2e3` (`feat: implement V3 test cycle workflow`) was pushed to the isolated `staging` branch after 35 passing tests, one intentional opt-in database-test skip, and a successful production build. Vercel created a fresh staging Preview deployment for this commit; it was still building at the first dashboard check. Production remains unchanged.

The second dashboard observation showed the same Preview continuing to build after approximately 90 seconds. Deployment logs must be checked if it does not transition to Ready.

The deployment then reached **Ready** in 58 seconds at `https://mizan-al-jawda-crowd-testing-git-staging-youssef-soliman.vercel.app`, sourced from `staging` commit `463a2e3`. An authenticated, read-only workspace visit displayed the tester sidebar with the dedicated overview, reports, wallet, and test-lead entries; the initial content state was still loading, so the individual menu render checks remain pending. No user data was changed.

After loading, the workspace showed the tester’s persisted dashboard data and an unaccepted test cycle. Selecting `تقاريري` changed the URL to `?section=reports`, but the rendered content still retained the overview sections. The menu’s query update works, but this staging check identified a remaining client-side section-render issue that must be corrected before completion. No state-changing control was used.

The correction was committed to `staging` as `60e99c6` after 35 passing tests, one intentional opt-in database-test skip, and a successful build. The Vercel dashboard refresh timed out from the connected browser immediately after the push, so deployment readiness and the rendered section behavior remain to be checked directly once the Preview is reachable.

The staging Preview URL subsequently returned HTTP 200 from Vercel. A read-only authenticated visit to `/workspace?section=reports` rendered the dedicated `تقاريري` view, including the saved-report heading and notification panel, rather than the overview. This confirms the reactive query-string correction works for reports; the wallet view still needs the equivalent browser check.

The equivalent read-only visit to `/workspace?section=wallet` rendered the dedicated `المحفظة` view with the available-balance summary and withdrawal entry point, without submitting a request. The deployed navigation check is complete for both required tester menu entries.

## Validation coverage and limits

The reviewed V3 migration was applied successfully to the isolated staging Supabase project. The final source validation passed **35 tests**, with **one intentional opt-in database test skipped**, and the production build completed successfully. The automated coverage includes server-derived role guards, invalid report rejection before persistence, required explanations for rejection and information requests, status-history projection, protected Community Manager and TTL selectors, safe handling when email delivery is unavailable, the report-review notification trigger, and the reactive reports and wallet navigation contract.

The staging browser checks were deliberately read-only. They did not create an application, accept a tester, submit a report, assign a TTL, make a Community Manager, decide a report, or request a payout. Consequently, populated report rendering and the full Business Owner/assigned-TTL workflow still require authorized fixture accounts and explicit permission to create or change test data. The email adapter is connected in staging but broad recipient delivery remains gated on a verified Resend sender; no Vercel Production mail configuration or production deployment was changed.

The regression suite was then expanded with fixture-backed application and invitation authorization checks, a report-presentation helper tested with persisted field and status-history fixtures, and assertions that the tester, authorized Business Owner, and assigned TTL views all use the same report record component. A real browser-like interaction test now clicks the shipped tester **عرض البيانات المحفوظة** control and verifies the persisted steps, expected result, actual result, ordered status history, and review note—without a test-only display override. The actual Business Owner and assigned-TTL report surfaces are rendered with the same populated fixture. The resulting full suite passed **43 tests**, with **one intentional opt-in database test skipped**, and the production build passed. This validates the shared server projection and UI presentation contract without creating or altering staging business data.

The final implementation-and-test staging commit `d4d6b38` deployed successfully to Vercel as a **Ready Preview** in 58 seconds. It is sourced from `staging` and is available through the staging branch preview URL. The Vercel dashboard continued to show Production separately on its existing deployment; no Production deployment, Production environment variable, domain, or data was changed during V3 validation.

## Staging workflow and workspace update

The following update is scoped to the isolated `staging` branch and staging Supabase project. It does not promote code, data, mail configuration, or authentication changes to Production.

| Area | Implemented staging behavior |
| --- | --- |
| Public navigation | The product logo returns to the public home route, whose header and calls to action now recognize an existing authenticated session rather than prompting that user to sign in again. |
| Invitations and applicants | Business Owners can invite a completed tester by email. Applicant panels prefer the account display name and fall back to the persisted email address, instead of the generic tester label. |
| Notifications | The header bell renders the same actionable in-app notification feed as the dedicated notification area. |
| Test-cycle access and TTL navigation | Accepted testers receive a cycle-detail view containing their permitted reporting context. The `قيادة الاختبارات` navigation entry is hidden unless the tester has an active per-cycle TTL assignment. |
| Withdrawals and transfer audit | Arabic-Indic and Persian digits are normalized in the withdrawal amount field before the existing server-side monetary validation. A pending request stays pending until a Community Manager confirms sending; confirmation creates a `payout_sent` transaction event, updates the request, and notifies the tester. |
| Transaction views | A tester’s payout and transaction history remains scoped to that tester’s wallet. Community Managers receive a named, cross-tester audit view and a pending-transfer confirmation queue. |
| Report evidence | The reporter, assigned TTL, and owning Business Owner receive the existing server-enforced signed evidence URL contract; image evidence is rendered as an image while non-image evidence remains a safe file link. |
| Workspace focus | Client and Community Manager overviews contain only summary metrics and navigation guidance. Projects, accepted reports, applicants/invitations, TTL assignment, and transfer activity live in dedicated query-parameter workspace sections. |

Migration `0005_payout_transfer_tracking.sql` was applied only to the isolated staging project. It adds the `payout_sent` transaction event type used to record a completed transfer without changing existing transaction records.

## Validation record for the update

The full suite passed **53 tests**, with **one intentional opt-in database test skipped**. The coverage includes Community Manager-only payout confirmation, pending-state conflict protection, immutable `payout_sent` event creation, tester-scoped history, named Community Manager audit history, secure image rendering in the reporter/assigned-TTL/Business-Owner surfaces, and the absence of detailed Client and Community Manager data from their overview sections. The production build completed successfully; the client bundle retains an existing size warning only.

The final visual check was deliberately unauthenticated and read-only. It confirmed the public landing page and the protected workspace access gate render correctly. No test cycle, application, invitation, report, withdrawal, payout, role assignment, or other business data was created or changed through the browser during this update. Authenticated staging workflow testing remains appropriate only with explicit permission and non-production fixtures.
