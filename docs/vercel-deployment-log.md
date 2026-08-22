# Vercel Deployment Log

## Initial project bootstrap

On 22 August 2026, a Vercel project named `mizan-al-jawda-crowd-testing` was created under the `youssef-soliman` Hobby team from the private GitHub repository `yosf33/mizan-al-jawda-crowd-testing`.

The first automatic deployment used the repository default branch, `main`, and completed successfully at the generated Vercel deployment URL. This bootstrap deployment is not the Supabase migration acceptance candidate. No custom domain was attached and the existing Manus deployment was not modified.

## Pending migration deployment

The acceptance candidate is the private Git branch `migration/supabase-vercel-free-tier`. Before validating application behavior, configure the production branch and environment variables in Vercel, deploy that branch, then record the generated deployment URL, commit, health-check result, and validation outcomes here. Never record credentials, database URIs, or Supabase secret keys in this file.

## Configuration update

Vercel Production branch tracking now targets `migration/supabase-vercel-free-tier`. The required Production environment variable names have been saved in Vercel’s protected variable storage: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. Their values are intentionally omitted from this log. A new migration-branch deployment is required for the saved settings to take effect.
