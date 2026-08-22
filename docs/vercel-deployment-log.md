# Vercel Deployment Log

## Initial project bootstrap

On 22 August 2026, a Vercel project named `mizan-al-jawda-crowd-testing` was created under the `youssef-soliman` Hobby team from the approved public GitHub repository `yosf33/mizan-al-jawda-crowd-testing`.

The first automatic deployment used the repository default branch, `main`, and completed successfully at the generated Vercel deployment URL. This bootstrap deployment is not the Supabase migration acceptance candidate. No custom domain was attached and the existing Manus deployment was not modified.

## Migration deployment

The migration branch `migration/supabase-vercel-free-tier` was pushed and Vercel reported a successful Production deployment from commit `89c99d8`. The immutable deployment URL is `https://mizan-al-jawda-crowd-testing-9366iomjf-youssef-soliman.vercel.app`. No custom domain was attached and the existing Manus deployment was not modified.

## Configuration update

Vercel Production branch tracking now targets `migration/supabase-vercel-free-tier`. The required Production environment variable names have been saved in Vercel’s protected variable storage: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. Their values are intentionally omitted from this log. A new migration-branch deployment is required for the saved settings to take effect.

Vercel Authentication was disabled with the user’s explicit approval, making the generated Vercel deployment URL publicly accessible. Public accessibility will be verified before acceptance.

## Function incident and correction

On the first public health-check request, `/api/health` returned Vercel `FUNCTION_INVOCATION_FAILED`. Vercel logs identified an extensionless source import from `/var/task/api/[...path].js` to `/var/task/server/app` as the cause. The deployment build now bundles the shared Express application into an ignored `api/vercel-handler.js` artifact and the API entrypoint imports that artifact. Local type checking, all 14 unit tests, and the Vercel build command passed after this correction. A new migration-branch deployment and live health check remain required.

The corrected commit `cfa9339` completed successfully as a Vercel Production deployment. The stable public production endpoint `https://mizan-al-jawda-crowd-testing.vercel.app/api/health` returned HTTP 200 with `{"configured":true,"ok":true,"service":"mizan-al-jawda"}`, confirming that the public Function starts with its protected runtime configuration.

The final public Production alias `https://mizan-al-jawda-crowd-testing.vercel.app/` was opened after commit `cfa9339` and rendered the Arabic right-to-left landing experience without Vercel login or access protection. This confirms both the public application shell and the public health endpoint are live on the corrected Production deployment.

Supabase Authentication URL Configuration now uses `https://mizan-al-jawda-crowd-testing.vercel.app/` as its persisted Site URL. The permitted redirect URL allow-list contains the exact public Production alias and `http://localhost:3000/` for local development. No broad Vercel wildcard was added.

Credential rotation was approved after review identified that server credential values had been entered during the initial configuration workflow. Supabase API-key settings are ready for a replacement server key. Generated credential values will not be recorded in this repository, this log, or task messages.

After the user completed the rotation directly in provider settings, Vercel created Production deployment `593WiaBggjfbUkZAAYVN4jCot9en` from commit `cfa9339`. It reached `Ready` after 51 seconds and is the post-rotation deployment candidate for the remaining public API and application validation.

During post-rotation validation, `/api/health` returned HTTP 200, but a nested `/api/trpc/account.profile` request returned a Vercel platform 404. The generic `api/[...path].ts` Function serves shallow API paths but does not reliably register nested procedure paths in this deployment. The pending correction adds an explicit `api/trpc/[procedure].ts` Function entrypoint backed by the same bundled Express handler. A data-free `/api/health/database` readiness probe is included to validate the new transaction-pooler password in Production without exposing credentials or product data. Local type checking, 17 unit tests, and the production build pass; the credential-dependent local database integration test is intentionally opt-in after the password rotation. Local Vercel CLI validation is blocked by an invalid sandbox token, so the Vercel dashboard deployment remains the authoritative deployment check.

The deployment triggered by commit `2bc826a` is currently building in Vercel Production. Live nested tRPC and database-readiness checks will be performed only after it reaches a terminal build result.

Deployment `EEFrq4QwwRSurBYhRbfc6RcQQH7X` from commit `2bc826a` completed as the latest Vercel Production deployment in 47 seconds. The nested tRPC request `https://mizan-al-jawda-crowd-testing.vercel.app/api/trpc/account.profile` now reaches the application and correctly returns a 401 `UNAUTHORIZED` response without authentication. The deeper database probe path `/api/health/database` still receives a Vercel platform 404, which shows that it also requires an explicit nested Function entrypoint before post-rotation database validation can be completed.

Commit `ebbfd4e` adds the explicit health probe Function entrypoint and is building as the next Vercel Production deployment. Its live database-readiness result remains pending.

At the latest dashboard check, the `ebbfd4e` Production build remained in progress after approximately two minutes and thirty-eight seconds; Vercel had not reported a terminal build result or a new runtime error.

The `ebbfd4e` deployment subsequently reached Vercel Production **Ready** in 53 seconds. The public data-free probe `https://mizan-al-jawda-crowd-testing.vercel.app/api/health/database` returned HTTP 200 with `{"configured":true,"database":"ready","ok":true,"service":"mizan-al-jawda"}`. This verifies that the rotated Vercel `DATABASE_URL` reaches the Supabase transaction pooler without returning database data or credentials.

Public HTTP checks confirmed that `/`, `/sign-in`, `/api/health`, and `/api/health/database` all return HTTP 200. Each response includes the configured Content Security Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and HSTS headers.

After the credential rotation, type checking completed with no errors; the unit suite passed with 18 tests passing and one intentionally opt-in database integration test skipped; and the production build completed successfully. A scan of `dist/public` found no server-key, transaction-pooler URI, or server-secret variable patterns. The local Vercel CLI build command cannot run because the sandbox CLI token is invalid; the Vercel dashboard’s successful Production build is the authoritative serverless-build evidence.

Visual checks confirmed that the public Arabic RTL landing page and direct `/sign-in` SPA route render on desktop. A mobile check found and corrected clipping of the sign-in card; local type checking, unit tests, and production build pass after the correction, and the repaired card is fully visible at a 375px-wide viewport. This responsive repair is pending deployment to the public Vercel alias.

The completed production checks cover public reachability, SPA deep links, API health, database readiness, unauthenticated tRPC rejection, security headers, and the public sign-in surface. Successful authenticated role workflows, evidence authorization, financial ledger reconciliation, direct cross-user RLS testing, and a backup/restore rehearsal remain unexecuted because no dedicated non-production test accounts or fixtures have been authorized for this closed-beta project.

The Supabase Auth provider page confirmed that Email was disabled, which explains the public sign-in error. With the user’s approval, the Email provider was enabled, the provider overview was refreshed to confirm the persisted enabled state, self-service signups were disabled, and Confirm email remained enabled. The refreshed dashboard markup confirmed `aria-checked="false"` for the self-service signup switch and `aria-checked="true"` for the confirmation switch; manual linking and anonymous sign-ins remain disabled. The remaining authentication check is a sign-in roundtrip using a purpose-made temporary account that will be removed after testing. The authorized Supabase command-line integration supports data, migrations, logs, and advisor checks but does not expose hosted email-provider settings, so this dashboard-only control remains an exception to the command-line preference.

## Supabase advisor and local follow-up validation

The authorized Supabase management integration confirmed the target project, expected public-schema tables, and applied migrations, including the non-destructive `0003_add_foreign_key_covering_indexes` migration. Its focused performance-advisor follow-up reported no missing-foreign-key-index finding. The remaining 18 messages are `INFO`-level unused-index observations for a project without production workflow traffic; no index was removed on that basis. The earlier security-advisor review remained free of actionable security findings.

A purpose-made temporary account successfully signed in through the public Vercel sign-in page and reached the authenticated onboarding gate. No onboarding form was submitted, so no application role, device, wallet, or workflow records were created for that account. An explicit Arabic logout action was then added to the onboarding route so unprovisioned closed-beta users can end a session without creating those records; its public deployment and interactive logout check remain pending. Local mobile validation independently captured both the sign-in and unauthenticated onboarding routes at a 375px viewport, confirming that their cards are fully contained after the responsive fixes. No account identifiers or credentials are recorded here.

Vercel Production deployment `Frgk1HRPDm6bqb7s82wFo1CUcUaf` for commit `98a4a71` reached **Ready** in 54 seconds from the `migration/supabase-vercel-free-tier` branch. The stable public alias remains `https://mizan-al-jawda-crowd-testing.vercel.app/`; no custom domain was added and the existing Manus deployment remains unchanged. Public endpoint checks, authenticated logout validation, and temporary-user cleanup will be recorded only after this exact deployment is tested.

On that deployment, public `GET /`, `GET /sign-in`, `GET /api/health`, and `GET /api/health/database` returned HTTP 200. The unauthenticated `account.profile` tRPC boundary returned the intended HTTP 401 response, and the documented CSP, HSTS, `nosniff`, frame-denial, and referrer-policy headers were present. The temporary closed-beta user signed in successfully, reached the onboarding gate without submitting it, and selected the new Arabic logout action, which redirected to `/sign-in`. The user therefore has no tester/client workspace data or workflow records; deletion of the temporary Auth account, whose profile cascades on deletion, is the final cleanup action.

## Staging environment setup

An isolated Supabase staging project was created in the same Frankfurt region as Production after the provider-reported zero-cost confirmation. A dedicated `staging` Git branch generated a distinct Vercel Preview deployment. The existing public Production branch, production Supabase project, Production-scoped variables, custom domains, and Manus deployment remain unchanged.

`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are both restricted to the Vercel **Preview** environment and the dedicated `staging` branch. The Vercel variable inventory confirms that the existing `DATABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` entries remain **Production**-scoped. A post-entry scope inspection showed only the two client-side `VITE_` staging overrides, so the server-only staging overrides require one further confirmation before deployment. Their values are intentionally omitted. Remaining staging work consists of completing branch-scoped server variable configuration, closed-beta Auth configuration, and isolated runtime validation.

The first additional Preview-only server-variable form was prepared with the `SUPABASE_URL` name only. The user entered its value directly in Vercel, and the resulting row was verified by name and scope only as **Preview → staging**. No value was inspected, retained, exposed, or deployed.

The `SUPABASE_PUBLISHABLE_KEY` server entry was likewise saved and verified by name and scope only as **Preview → staging**. Production-scoped rows remain separate; no value was inspected or retained.

The `SUPABASE_SECRET_KEY` server entry was saved with the Sensitive control enabled and verified by name and scope only as **Preview → staging**. Its value was not inspected or retained.

The final `DATABASE_URL` server entry was saved with the Sensitive control enabled and verified by name and scope only as **Preview → staging**. The staging Preview inventory now has the four expected client/runtime pairs (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) plus server-only `SUPABASE_SECRET_KEY` and `DATABASE_URL`; all Production rows remain separate. No variable value was inspected, retained, or documented.

The isolated `staging` branch deployment (`26203a9`) completed as a Vercel Preview in 52 seconds. The stable branch preview is `https://mizan-al-jawda-crowd-testing-git-staging-youssef-soliman.vercel.app/`; the staging Supabase project still had only its default localhost Site URL and no redirect URLs before the next configuration step. Production deployment settings, domains, and Auth settings were not changed.

The staging Supabase Auth Site URL was updated to the stable staging Preview URL. The redirect-URL dialog is now prepared to add that same exact URL; no wildcard or Production URL is being introduced.

The exact stable staging Preview URL was submitted as the sole staging Auth redirect allow-list entry. The next step is to refresh and verify persistence, then to retain the closed-beta provider controls independently of Production.

The staging Auth URL configuration now shows the stable staging Preview URL as both Site URL and the only redirect URL. In staging providers, Email is enabled, Confirm email is enabled, manual linking and anonymous sign-ins are disabled, and self-service signup was switched off pending save. These checks were performed only against the isolated staging project.

The staging provider page was independently inspected after the attempted save. Its Save changes button was disabled, indicating no unsaved provider changes. The page markup confirms self-service signup, manual linking, and anonymous sign-ins are unchecked, while Confirm email is checked; the Email provider is shown as enabled. The staging closed-beta provider state is therefore persisted.

The staging Auth URL configuration was refreshed and confirms that the exact stable staging Preview URL is configured as the Site URL and the sole redirect allow-list entry. No wildcard, Production URL, or custom domain entry was added to staging Auth.

The refreshed `staging` branch Preview deployment for commit `4eaf0df` reached **Ready** in 54 seconds after the six branch-scoped staging variables were saved. Its stable branch URL is `https://mizan-al-jawda-crowd-testing-git-staging-youssef-soliman.vercel.app/`. On that deployment, `GET /`, `GET /sign-in`, `GET /api/health`, and `GET /api/health/database` each returned HTTP 200; the database readiness probe reported `database: ready`; and the unauthenticated `account.profile` tRPC request returned the expected HTTP 401 boundary. The Preview response also contained CSP, HSTS, `nosniff`, frame-denial, and referrer-policy headers, and the landing markup declares Arabic RTL. These checks establish a working isolated runtime path without using a user credential or reading data.

The staging project began empty and received only the reviewed schema migrations, RLS/default-deny policies, indexes, and private evidence bucket. Its Supabase security advisor had no actionable findings, and the index follow-up removed the prior missing-foreign-key-index warning. Production was not queried or modified during the staging setup. An authenticated staging user journey and fixture-based role, evidence, financial-concurrency, direct-RLS, and restore tests remain intentional release-gate work; no staging test account or business fixture has been created in this setup step.
