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
