# Supabase deployment assets

Apply `migrations/0001_initial_schema.sql` to a new or empty Supabase project before running the application. It creates the PostgreSQL schema, `auth.users` profile trigger, financial constraints, private evidence bucket, and default-deny Row Level Security.

The application routes all data and storage requests through the Vercel Function. The browser uses only the Supabase publishable key to create and refresh an authentication session. The trusted function uses the current Supabase Secret API key to validate requests, transact business workflows, and issue signed evidence URLs; keep that key exclusively in Vercel server-only environment variables.

The prior `drizzle/meta` snapshots came from the retired MySQL schema and are not a valid PostgreSQL migration lineage. `supabase/migrations` is the authoritative portable deployment history for this migration branch.
