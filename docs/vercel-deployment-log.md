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
