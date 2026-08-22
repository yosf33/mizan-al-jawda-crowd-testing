# Portable runtime configuration

The application uses Supabase’s current **Secret API key** model for server-side database and private-storage operations. Configure the following values in Vercel Project Settings for both **Preview** and **Production**. Never commit them to source control.

| Variable | Runtime | Purpose |
|---|---|---|
| `SUPABASE_URL` | Server only | Supabase project endpoint used by the trusted Vercel Function. |
| `SUPABASE_PUBLISHABLE_KEY` | Server only | Public key retained by the server readiness contract. |
| `SUPABASE_SECRET_KEY` | Server only | Current `sb_secret_…` key used by the trusted backend after it validates the requesting user. |
| `DATABASE_URL` | Server only | Supabase pooled PostgreSQL connection string used by Drizzle. |
| `VITE_SUPABASE_URL` | Browser-safe build value | Supabase endpoint for the browser Auth client. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser-safe build value | Publishable key for the browser Auth client. |
| `PUBLIC_APP_URL` | Server only, optional | Reserved for future redirect and allowed-origin configuration. |

Vercel must receive `DATABASE_URL`, not `SUPABASE_DATABASE_URL`. The latter exists only as a controlled local validation fallback while the current managed workspace injects migration credentials. Its database password must be URI encoded when composing a pooler URL.

The Vercel build runs `pnpm run vercel-build`, produces `dist/public`, and deploys `api/[...path].ts` as the function for `/api/*`. The SPA rewrite explicitly excludes API paths so `/api/health` and `/api/trpc` are never sent to `index.html`.

For migration compatibility only, the server will also accept the older `SUPABASE_SERVICE_ROLE_KEY` variable when `SUPABASE_SECRET_KEY` is absent. New deployments should use the current `SUPABASE_SECRET_KEY` name.
