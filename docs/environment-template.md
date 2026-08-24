# Environment variable template

Copy these variable **names** into your local environment file or Vercel Project Settings. Replace every placeholder with a value from your own Supabase or Resend account. Do not commit a `.env` file or paste any real credential into documentation.

```text
# Browser-safe Supabase configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_with_your_key

# Trusted Vercel Function configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_with_your_key
SUPABASE_SECRET_KEY=sb_secret_replace_with_your_server_key
DATABASE_URL=postgresql://postgres.your-project-ref:ENCODED_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
PUBLIC_APP_URL=https://your-project.vercel.app

# Optional email notifications
RESEND_API_KEY=re_replace_with_your_key
EMAIL_FROM=Quality Platform <onboarding@resend.dev>
```

`VITE_` values are visible to the browser and must contain only Supabase’s URL and publishable key. Keep `SUPABASE_SECRET_KEY`, `DATABASE_URL`, and `RESEND_API_KEY` server-only in Vercel.
