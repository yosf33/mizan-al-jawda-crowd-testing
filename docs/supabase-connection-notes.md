# Supabase connection notes

The portable target is the Supabase project `bqhtyuchbufojjfntvds` in the Central EU region. Its server-only Secret API key was validated with a minimal administrative request, and the Supabase advisor reported no active security or performance findings after the default-deny policy migration.

The Vercel serverless deployment must use the **transaction pooler** for short-lived, stateless Function requests. This endpoint uses port `6543` and the project-scoped PostgreSQL user. The full connection string, password, and all other credentials are intentionally stored only in Vercel server-only environment variables and must not be copied into this file, GitHub, test output, or browser code.

Connection verification is performed with a minimal `current_database()` query through the server-only runtime configuration. The password is only visible in the authenticated Supabase connection panel immediately after a reset and must be captured directly into the secret store rather than documentation.
