import { resolvePostgresDatabaseUrl } from "./database-url";

const value = (name: string) => process.env[name]?.trim() || "";

export const env = {
  nodeEnv: value("NODE_ENV") || "development",
  // Vercel supplies PostgreSQL through DATABASE_URL. The local managed
  // workspace retains an unrelated MySQL value, so it uses the controlled
  // Supabase fallback only when DATABASE_URL is not PostgreSQL.
  databaseUrl: resolvePostgresDatabaseUrl(value),
  supabaseUrl: value("SUPABASE_URL"),
  supabasePublishableKey: value("SUPABASE_PUBLISHABLE_KEY"),
  // Supabase now issues server-only Secret API keys (`sb_secret_…`).
  // Accept the legacy service-role variable during controlled migrations.
  supabaseSecretKey: value("SUPABASE_SECRET_KEY") || value("SUPABASE_SERVICE_ROLE_KEY"),
  publicAppUrl: value("PUBLIC_APP_URL"),
  resendApiKey: value("RESEND_API_KEY"),
  emailFrom: value("EMAIL_FROM"),
};

export function hasServerConfiguration() {
  return Boolean(env.databaseUrl && env.supabaseUrl && env.supabasePublishableKey && env.supabaseSecretKey);
}

export function requireServerConfiguration() {
  if (!hasServerConfiguration()) throw new Error("The Supabase server configuration is incomplete.");
}
