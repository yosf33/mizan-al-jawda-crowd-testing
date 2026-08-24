# Staging Environment Plan — No Settings Changed

**Prepared for:** ميزان الجودة / Crowd Testing Platform  
**Prepared by:** Manus AI  
**Status:** Planning only. This document makes **no** Git, Vercel, Supabase, DNS, Manus, or credential change.

## Executive decision

The platform should use a **separate Supabase staging project** and Vercel’s existing **Preview** environment. This is the only recommended Free-tier-compatible design that keeps staging users, database rows, private evidence objects, Auth sessions, and configuration separate from Production. A Vercel Preview that reused the Production Supabase project would not be a safe test environment.

> **Staging definition:** a live, non-production deployment connected only to isolated non-production Auth, PostgreSQL, and Storage resources. It must never carry production personal data, credentials, evidence, payouts, or real user sessions.

Vercel creates Preview deployments from non-production Git branches without changing the production deployment; each has generated URLs suitable for pre-production QA.[1] Supabase recommends separate staging and production projects for this workflow, with migrations promoted only after staging validation.[2] [3]

## 1. Invariants and current baseline

| Area | Baseline to preserve | Plan rule |
|---|---|---|
| Production web app | The public Vercel alias remains the live closed-beta application. | Do not alter its domain, deployment, access setting, or production branch during plan preparation. |
| Manus | The existing Manus deployment remains available. | Do not change its URL, routing, or custom-domain configuration. |
| Production Supabase | Existing Auth, PostgreSQL, private evidence bucket, RLS, and credentials remain production-only. | Never point a Preview deployment at these resources. |
| Git | `migration/supabase-vercel-free-tier` remains the current production-tracked branch. | Retain it as the promotion target; add a new non-production `staging` branch only after approval. |
| Data | Production and the retained disposable account are not part of staging. | Do not copy production user, report, wallet, payout, attachment, or audit data to staging. |
| Credentials | Server secrets must remain out of source, documentation, Git history, and test output. | Enter values only through provider secret controls; document variable **names** and environments, never values. |

## 2. Target topology

| Environment | Git source | Vercel deployment class | Supabase resource | Permitted data |
|---|---|---|---|---|
| Local development | `feature/*` branches | Local server only | Local Supabase CLI stack when available | Synthetic, disposable test fixtures only |
| Staging | `staging` branch | Vercel **Preview** deployment | New, separate Free-plan Supabase project | Purpose-made test users and non-sensitive fixtures only |
| Production | `migration/supabase-vercel-free-tier` branch | Existing Vercel **Production** deployment | Existing production Supabase project | Approved closed-beta data only |
| Manus | Unchanged | Existing deployment | Unchanged | Unchanged |

The Free plan permits two active Supabase projects per eligible organization. A separate staging project is therefore feasible only if the organization has one active-project slot remaining; this must be verified before creation.[4] Supabase project branching is a Pro-plan feature, so this plan deliberately uses a second project rather than provider-managed database branches.[3]

## 3. Exact implementation sequence — for later approval

| Step | Planned action | Safety condition and expected result | Production impact |
|---|---|---|---|
| 0 | Record the current production commit, Vercel deployment ID, environment-variable names, and migration versions. | Record identifiers and statuses only; do not retrieve secret values. | None |
| 1 | Confirm a second active Supabase Free project can be created. | Stop if the organization has no available Free-project slot; do not pause or delete any project automatically. | None |
| 2 | Create a new Supabase project named for staging in the same appropriate region. | Treat it as empty; do not clone production data or import Auth users. | None |
| 3 | Create Git branch `staging` from the exact current production commit. | The branch contains the same tested source and migrations initially. | None |
| 4 | Let the existing Vercel Git integration build the `staging` branch as a Preview deployment. | Confirm it is Preview—not Production—and retain its generated branch URL. | None |
| 5 | Set only Preview-scoped Vercel variables to the staging project’s public client configuration and protected server configuration. | Production-scoped variables remain untouched. Use provider secret controls; never commit `.env` files. | None |
| 6 | Configure staging Supabase Auth after the Preview URL exists. | Enable Email, retain confirmation, disable self-service signup, use the exact Preview URL as Site URL/redirect allow-list entry, and create only disposable staging users. | None |
| 7 | Apply the repository’s reviewed migrations to the empty staging database in order. | Check migration inventory and security/performance advisors; confirm private evidence Storage and RLS/default-deny policies. | None |
| 8 | Run the staging acceptance gate described below. | No Production promotion until every required check passes or a documented exception is approved. | None |
| 9 | Open a reviewed pull request from `staging` to `migration/supabase-vercel-free-tier`. | Compare code and migrations; require checks and explicit approval. | None until merge |
| 10 | Merge the approved pull request. | Existing Vercel Production branch deploys only the reviewed commit. | Controlled Production update |

The Vercel Preview URL is expected to be public while Vercel Authentication remains disabled. It is still protected at the application layer by closed-beta Supabase Auth and by the complete separation of its data. Preview deployments are not indexed by search engines by default; this should nevertheless be verified in the release gate.[1]

## 4. Vercel configuration contract

Vercel has Local, Preview, and Production environments. The built-in Preview environment is sufficient here; Vercel Custom Environments are a Pro/Enterprise feature and are unnecessary for this Free/Hobby plan.[1]

| Vercel setting | Preview / `staging` value | Production value | Verification |
|---|---|---|---|
| Git branch | `staging` | `migration/supabase-vercel-free-tier` | Dashboard deployment type and source branch are correct. |
| Client Supabase URL and publishable key | Staging project only | Existing production project only | Build’s `/sign-in` authenticates only against the intended environment. |
| Server database URL and Supabase server secret | Staging project only; protected | Existing production values; protected | `/api/health/database` reaches the intended database without exposing credentials. |
| `APP_ENV` (new) | `staging` | `production` | UI/API diagnostic label and test safeguards use the intended environment. |
| Preview public indexing | Default Vercel Preview no-index behavior, verified by header check | Production SEO policy unchanged | Inspect `X-Robots-Tag` on Preview. |
| Domains and DNS | Generated Vercel Preview URL only | Existing public alias and all custom-domain choices unchanged | No DNS record or domain assignment change. |

## 5. Supabase staging configuration contract

The staging Supabase project is created empty and populated only by committed migrations. Supabase’s documented release workflow uses separate staging and production projects and deploys migrations from the corresponding branches.[2]

| Component | Staging requirement | Explicit prohibition |
|---|---|---|
| PostgreSQL | Apply the repository’s migration set, including schema, indexes, RLS, triggers, and integrity constraints. | No production database copy, restore, or connection string. |
| Auth | Email provider enabled; Confirm email enabled; Allow new users to sign up disabled; exact Preview URL in Site URL and redirect allow-list. | No production user import, broad redirect wildcard, or real-user credential reuse. |
| Storage | Private `bug-evidence` bucket with migration-declared MIME and size restrictions. | No production evidence copy or public bucket. |
| Test users | Create temporary tester, client, and admin fixtures only in the staging project; document roles and lifecycle without credentials. | No fabricated public reviews, ratings, or testimonials. |
| Secrets | Store only in provider secret stores and CI secrets. | No source, README, issue, log, deployment output, or chat disclosure. |

For operational work, use the official Supabase CLI in a controlled local/CI environment where available—`supabase migration list`, `supabase db push`, and local `supabase start`/`db reset`—with non-interactive CI secrets. Hosted Auth provider controls remain dashboard-only and must be changed through the provider UI after approval.[2] The already authorized Supabase management interface may be used for supported read-only checks, migration application, advisor checks, and logs; it is not a substitute for an isolated environment.

## 6. Staging acceptance gate

| Gate | Required staging evidence | Pass condition |
|---|---|---|
| Source integrity | TypeScript check, Vitest suite, production build, and public-build secret-pattern scan. | All required commands pass; any intentional skip is documented. |
| Deployment | Vercel Preview status, branch, commit, and generated URL. | Ready Preview deployment built from `staging`; no production alias changed. |
| Public boundaries | `/`, `/sign-in`, `/api/health`, `/api/health/database`, and unauthenticated `account.profile`. | Landing/sign-in/health routes return expected responses; protected tRPC returns controlled 401. |
| Auth lifecycle | Invite-created staging user signs in, reaches onboarding, logs out, and cannot retain a session afterward. | Redirect and logout work; self-service signup remains unavailable. |
| Roles | Staging tester, client, and admin fixtures are authorized only for their intended routes. | Cross-role calls return controlled denial; no production account used. |
| Evidence privacy | Upload staging-only evidence, request an authorized signed URL, attempt unauthorized access. | Authorized access is short-lived; unauthorized/direct access is denied; bucket is private. |
| Financial correctness | Run controlled, non-monetary staging bounty/payout state transitions and concurrency checks. | Ledger remains balanced; duplicate/invalid transitions are rejected; no external transfer occurs. |
| Database security | Supabase security and performance advisors, RLS checks, migration inventory, and safe database probe. | No unresolved high-risk advisor findings; all expected migrations present. |
| RTL and responsive UI | Capture desktop and 375px screenshots for landing, sign-in, onboarding, and relevant workspaces. | Arabic direction, controls, and cards remain visible without horizontal overflow. |
| Cleanup | Delete staging-only fixtures/evidence or reset the disposable staging project following test completion. | No credentials, sensitive data, or test evidence remains unnecessarily. |

## 7. Data safety and test-fixture rules

Staging starts with no production data. Test records must carry an internal staging marker, use non-personal aliases, and be deleted/reset at the end of a test cycle. The only permitted artifacts are synthetic application records necessary to validate roles, RLS, evidence authorization, and financial invariants. They must never be represented as customer feedback or testimonials.

Before a risky production migration, create a logically restorable export according to an approved backup procedure and verify a restore in a non-production environment. Free-plan operational constraints mean a production restore rehearsal may require a local PostgreSQL target or temporarily pausing an unused project; neither action is included in this plan and both require explicit approval.

## 8. Promotion and rollback controls

| Scenario | Required control | Recovery action |
|---|---|---|
| Feature or migration fails in staging | Do not merge the pull request. | Fix in `staging`, rerun the complete acceptance gate, and retest. |
| Preview accidentally targets production Supabase | Stop immediately before sign-in or data write. | Remove/correct Preview-scoped variables; verify the staging project URL before re-testing. |
| Production web regression after promotion | Keep previous Vercel production deployment identifiable before release. | Redeploy the last known-good production deployment; do not alter Manus or DNS. |
| Production schema issue | Use expand/contract migrations; avoid destructive schema changes in the same release. | Apply a reviewed forward-fix or execute the separately approved restore procedure; never improvise a destructive rollback. |
| Staging data contamination | Keep staging isolated and disposable. | Delete only staging fixtures/evidence or recreate the staging project after approval. |

No migration reaches Production merely because it compiles. Promotion requires the staging gate, a reviewed pull request, and an explicit human approval.

## 9. Decisions required before implementation

| Decision | Recommended selection | Why it is needed |
|---|---|---|
| Supabase capacity | Confirm one additional active Free project is available. | Required for genuine data/Auth/Storage isolation.[4] |
| Branch name | `staging` | Gives Vercel a predictable non-production branch for Preview deployments. |
| Preview access | Keep public generated URL, rely on closed-beta Auth, and validate no-index behavior. | Preserves the approved public-access posture without exposing production data. |
| CI scope | Add GitHub Actions that run source checks and deploy migrations to staging/production only with environment-scoped secrets. | Reduces manual migration drift and matches Supabase’s documented approach.[2] |
| Promotion policy | PR from `staging` to the existing production branch, with manual approval. | Preserves the production URL/branch while adding a controlled release gate. |
| Backup rehearsal | Select an approved local or non-production restore target before the first destructive production migration. | Ensures rollback evidence exists without touching Production during planning. |

## 10. Out of scope for this plan

This plan does **not** create a branch or Supabase project, add variables, install the Supabase CLI, apply a migration, alter Vercel settings, modify DNS, transfer a domain, change Manus, touch Production data, delete the retained temporary account, or expose a credential. Each action remains subject to a separate explicit implementation approval.

## References

[1]: https://vercel.com/docs/deployments/environments "Vercel — Environments"
[2]: https://supabase.com/docs/guides/deployment/managing-environments "Supabase — Managing Environments"
[3]: https://supabase.com/docs/guides/deployment "Supabase — Deployment & Branching"
[4]: https://supabase.com/docs/guides/platform/billing-faq "Supabase — Billing FAQ"
