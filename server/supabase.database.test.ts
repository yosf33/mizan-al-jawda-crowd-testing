import postgres from "postgres";
import { describe, expect, it } from "vitest";

describe("Supabase database runtime configuration", () => {
  const databaseIntegrationEnabled = process.env.RUN_DATABASE_INTEGRATION_TEST === "true";

  it.runIf(databaseIntegrationEnabled)("connects using the portable Vercel database contract", async () => {
    const databaseUrl = process.env.DATABASE_URL;

    expect(databaseUrl).toMatch(/^postgresql:\/\/postgres\.[a-z0-9]+:/);
    expect(databaseUrl).toContain("pooler.supabase.com:6543/postgres");

    const sql = postgres(databaseUrl!, { idle_timeout: 1, max: 1, prepare: false });
    try {
      const result = await sql<{ database_name: string }[]>`
        select current_database() as database_name
      `;

      expect(result[0]?.database_name).toBe("postgres");
    } finally {
      await sql.end({ timeout: 2 });
    }
  });
});
