import { createClient } from "@supabase/supabase-js";
import { env, requireServerConfiguration } from "./env";

let adminClient: ReturnType<typeof createClient> | undefined;

export function getSupabaseAdmin() {
  requireServerConfiguration();
  if (!adminClient) {
    adminClient = createClient(env.supabaseUrl, env.supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
  }
  return adminClient;
}
