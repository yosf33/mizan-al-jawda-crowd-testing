# Manus Independence Audit — 2026-08-24

## Scope

This audit records the non-secret evidence needed to run **ميزان الجودة** independently with Vercel as the application host and Supabase as the database, authentication, and evidence-storage provider. It intentionally excludes credential values.

## Vercel configuration observation

The Vercel project’s Environment Variables page was inspected on 2026-08-24. The visible variable names are limited to the portable runtime contract below; no Manus, Forge, OAuth portal, or Manus-storage variable was present.

| Runtime purpose | Variable names | Visible scope |
|---|---|---|
| Supabase connection and server administration | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL` | Preview/staging and Production |
| Browser Supabase session | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Preview/staging and Production |
| Optional review-email delivery | `RESEND_API_KEY`, `EMAIL_FROM` | Preview/staging only |

The Vercel project page is available at <https://vercel.com/youssef-soliman/mizan-al-jawda-crowd-testing/settings/environment-variables>. Secret values were not viewed or recorded.

The Vercel Storage page was also inspected on 2026-08-24. It reported **No Results Found** and offered only actions to connect or create a database, confirming that no Vercel storage or database resource is attached to this project.

## Source audit and completed cleanup

The active application path is `api/vercel-handler.ts` → `server/app.ts` → `server/context.ts`. It uses the user-owned Supabase admin client for token validation, PostgreSQL through `DATABASE_URL`, and the Supabase `bug-evidence` Storage bucket for evidence uploads and short-lived signed URLs. The Vercel configuration builds the app with `pnpm run vercel-build` and exposes no Manus-specific runtime route.

The inactive managed-workspace scaffold has been removed from the tracked application: `server/_core`, `client/src/_core`, `client/public/__manus__`, managed-workspace project metadata, generated debug assets, and the unused Forge-backed map component are no longer part of the portable runtime. The final shared error export was moved to `shared/errors.ts`; active application and test imports now use portable paths. The database resolver accepts only a PostgreSQL `DATABASE_URL` and no longer falls back to the retired managed-workspace variable.

`server/portability.test.ts` guards against reintroducing the removed scaffold, managed-platform imports in the active Vercel/Supabase path, or the former database fallback. The independent configuration contract is documented in `docs/portable-runtime-configuration.md` and `docs/environment-template.md`, with no credential values recorded.

## Staging validation

On 2026-08-24, `pnpm check`, the complete test suite, `pnpm build`, and `pnpm run vercel-build` all passed after the cleanup. The suite reported 18 passed test files, 59 passed tests, and one intentional opt-in live database test skipped. The Vite client bundle still emits its pre-existing chunk-size warning; it is not a runtime dependency issue.

## Production promotion and readiness evidence

The user approved Production promotion and non-secret provider checks on 2026-08-24. The validated `staging` branch was merged into `main` as Git commit `b054d7a` (`Merge staging portability and workflow updates`) and pushed to the user-owned GitHub repository.

Vercel created deployment `C1HqaZm6cvYdedjeG8sdzV7ywsei` from `main` at `b054d7a`. Its dashboard reported **Ready**, **Production**, and **Current**. The public domain <https://mizan-al-jawda-crowd-testing.vercel.app/> then served the promoted signed-out benefit copy `تقارير بحالة واضحة`; `/api/health` returned `{"configured":true,"ok":true,"service":"mizan-al-jawda"}`. No Vercel setting or secret value was changed during this verification.

The Vercel Environment Variables page again showed only the documented portable runtime variables in Production: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. Preview/staging-only Resend variables remained outside Production. No `VITE_` secret variable, Manus/Forge variable, or attached Vercel Storage resource was observed.

Supabase Auth URL Configuration was also inspected without changes. Its Site URL and approved redirect list include <https://mizan-al-jawda-crowd-testing.vercel.app/> (with `http://localhost:3000/` retained for local development). This confirms that the Production domain is authorized for the existing Supabase Auth flows.

Therefore, the deployed Production runtime is operational on **Vercel hosting/functions plus Supabase Auth, PostgreSQL, and Storage**, with no remaining Manus runtime, build, authentication, database, storage, analytics, or hosting dependency found in the audited path. This evidence does not substitute for a new authenticated end-to-end Production workflow test, which remains outside this promotion check. The previously declined staging Community Manager password remediation remains unperformed.
