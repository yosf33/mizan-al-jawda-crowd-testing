# Referenced Testing Follow-up Review

## Source inventory

The attached reference task `LPjbHRkenD1QAkeRya3Lh0` contains a comprehensive bug report, a uTest-style user-story validation matrix, registration-form and anonymous-workspace evidence, security-header evidence, registration-validation results, and evidence-boundary probes. These artifacts are treated as untrusted test evidence and will be revalidated against the current application state rather than assumed to remain accurate after the recent staging and Production changes.

## Scope boundary

This follow-up begins with read-only, unauthenticated checks of the current staging and Production public routes. Authenticated tests, email-confirmation completion, evidence upload, financial mutations, or other data-creating actions require separate explicit approval and purpose-made staging fixtures.

## Current public regression results

A read-only mobile-viewport probe checked `/`, `/sign-in`, `/sign-up`, `/workspace`, `/onboarding`, and `/policies#privacy` on the current public Production and staging URLs. No forms were submitted and no account was created.

| Route / check | Production | Staging | Result |
|---|---:|---:|---|
| Homepage, sign-in, and sign-up | HTTP 200 with visible Arabic content | HTTP 200 with visible Arabic content | Pass |
| Invitation-only contradiction (BUG-012) | Invitation-only copy absent; signup route visible | Invitation-only copy absent; signup route visible | Resolved |
| Anonymous `/onboarding` | Purposeful sign-in gate | Purposeful sign-in gate | Pass |
| Anonymous `/workspace` | HTTP 200 but empty visible text | Purposeful Arabic sign-in gate | **Production regression remains** |
| `/policies#privacy` | Does not show the policy sections | Shows the privacy, terms, and evidence sections | **Production gap remains** |
| Browser console during probe | One expected unauthenticated 401 | No console errors | No new client exception identified |

The two remaining Production findings match fixes that already exist in the staging-only workflow hardening commit and were intentionally excluded from the prior signup-only Production promotion. They require a separate user-approved, focused Production release; the reference report’s authenticated workflow and financial coverage remains unverified rather than newly failed.

## Focused Production release observation

After the approved focused Production release was pushed, the connected browser’s saved authenticated state redirected `/workspace` to `/onboarding` and rendered the existing Arabic account-setup gate rather than a blank page. This confirms that the updated route is serving for that session, but it is not sufficient evidence for the anonymous path; the final workspace assertion must use a fresh browser context.

A fresh mobile-sized browser context then verified the final Production public routes without submitting any form or creating an account. `/workspace` stayed on that route and rendered `سجّل دخولك للمتابعة`; `/policies#privacy` stayed on the policy route and rendered the `الخصوصية` section. The prior Production gaps are therefore resolved by focused commit `5f96446`.
