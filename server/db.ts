import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";

let client: ReturnType<typeof postgres> | undefined;
let db: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  if (!env.databaseUrl) return undefined;
  if (!db) {
    client = postgres(env.databaseUrl, { prepare: false, max: 5, idle_timeout: 20 });
    db = drizzle(client);
  }
  return db;
}

export async function closeDb() {
  await client?.end({ timeout: 5 });
}
