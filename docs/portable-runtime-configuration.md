# Independent Supabase and Vercel runtime configuration

The production runtime is **Vercel + Supabase only**. It does not need Manus hosting, authentication, storage, database, analytics, or build services. Configure the following values in Vercel Project Settings for both **Preview** and **Production**. Never commit real values to source control; use [`docs/environment-template.md`](environment-template.md) only as a variable-name template.

| Variable | Runtime | Purpose |
|---|---|---|
| `SUPABASE_URL` | Server only | Supabase project endpoint used by the trusted Vercel Function. |
| `SUPABASE_PUBLISHABLE_KEY` | Server only | Public key retained by the server readiness contract. |
| `SUPABASE_SECRET_KEY` | Server only | Current `sb_secret_…` key used by the trusted backend after it validates the requesting user. |
| `DATABASE_URL` | Server only | Required Supabase PostgreSQL transaction-pooler connection string used by Drizzle. |
| `VITE_SUPABASE_URL` | Browser-safe build value | Supabase endpoint for the browser Auth client. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser-safe build value | Publishable key for the browser Auth client. |
| `PUBLIC_APP_URL` | Server only | Approved Vercel deployment URL or custom domain. |

Vercel must receive a PostgreSQL `DATABASE_URL`; no managed-workspace fallback is supported. The database password must be URI encoded when composing a pooler URL. The application’s database, authentication, and private evidence bucket remain in the user-owned Supabase project.

The Vercel build runs `pnpm run vercel-build`, produces `dist/public`, and deploys `api/[...path].ts` as the function for `/api/*`. The SPA rewrite explicitly excludes API paths so `/api/health` and `/api/trpc` are never sent to `index.html`.

For migration compatibility only, the server also accepts the older `SUPABASE_SERVICE_ROLE_KEY` when `SUPABASE_SECRET_KEY` is absent. New deployments should use `SUPABASE_SECRET_KEY`.

## Recovery and independence checks

1. Keep this Git repository connected directly to the user-owned Vercel project; the Vercel build command is `pnpm run vercel-build`.
2. Keep the Supabase project, its Auth redirect URLs, PostgreSQL pooler, private evidence bucket, RLS policies, and migrations under the user’s Supabase account.
3. Before disabling Manus access, run `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm run vercel-build` in a clean clone with only the variables above.
4. Verify Vercel Preview, then verify `/api/health` and an authenticated Supabase workflow. Production configuration changes require explicit approval.
