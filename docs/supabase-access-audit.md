# Supabase Access Audit

The connected browser session reached the authenticated Supabase dashboard on 22 August 2026. The account belongs to the **Youssef Soliman** organization, which is on the **Free Plan** and currently shows **one project**. This confirms that the migration can use the existing Supabase account without creating a new organization.

The migration target is **Crowd Testing App** in the Central EU (Frankfurt) region, project reference `bqhtyuchbufojjfntvds`, with the endpoint `https://bqhtyuchbufojjfntvds.supabase.co`. At the time of inspection, dashboard usage reported 0 MB of 5 GB egress, 0 GB of 500 MB database capacity, 0 of 50,000 monthly active users, and 0 GB of 1 GB file storage. The project reports no GitHub repository, migrations, or backups yet.

No configuration value, database credential, or service-role secret is included in this file.

## Migration verification

On 22 August 2026, the empty legacy public schema was reset with user authorization and replaced with the portable initial migration. The resulting project contains all thirteen expected application tables, foreign-key relationships to `auth.users` and application profiles, and RLS enabled on every public application table. The initial Supabase security advisor report identified the deliberate default-deny RLS approach as informational lint findings and flagged the profile-creation trigger function as publicly executable; migration `0002_explicit_default_deny.sql` adds explicit restrictive policies and revokes direct trigger-function execution to remove those warnings while retaining backend-only access.

## Hosting rehearsal status

The earlier Render rehearsal was stopped before a service was created because its setup required a payment card. The approved hosting target is now Vercel. The source branch contains the Vercel Function entry point, static Vite output configuration, non-API SPA fallback, and serverless connection-pooling safeguards; no Vercel project, domain change, or production deployment has been created yet. Server-only database and Secret API key values remain protected and will not be committed or documented verbatim.
