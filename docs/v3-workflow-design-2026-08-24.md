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
