import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { hasServerConfiguration } from "./env";

export function runtimeHealthPayload() {
  const configured = hasServerConfiguration();
  return { configured, ok: configured, service: "mizan-al-jawda" };
}

/**
 * Confirms that the configured database can accept a minimal query without
 * returning connection details, user data, or schema information.
 */
export async function databaseHealthPayload() {
  if (!hasServerConfiguration()) return { configured: false, database: "unavailable" as const, ok: false, service: "mizan-al-jawda" };

  const db = getDb();
  if (!db) return { configured: true, database: "unavailable" as const, ok: false, service: "mizan-al-jawda" };

  try {
    await db.execute(sql`select 1`);
    return { configured: true, database: "ready" as const, ok: true, service: "mizan-al-jawda" };
  } catch {
    return { configured: true, database: "unavailable" as const, ok: false, service: "mizan-al-jawda" };
  }
}
