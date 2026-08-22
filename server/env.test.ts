import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnvironment() {
  vi.resetModules();
  return import("./env");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("portable server environment", () => {
  it("uses a PostgreSQL DATABASE_URL supplied by Vercel", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://primary.example.test/postgres");
    vi.stubEnv("SUPABASE_DATABASE_URL", "postgresql://fallback.example.test/postgres");

    const { env } = await loadEnvironment();

    expect(env.databaseUrl).toBe("postgresql://primary.example.test/postgres");
  });

  it("uses the controlled Supabase fallback when the managed DATABASE_URL is not PostgreSQL", async () => {
    vi.stubEnv("DATABASE_URL", "mysql://managed.example.test/platform");
    vi.stubEnv("SUPABASE_DATABASE_URL", "postgresql://fallback.example.test/postgres");

    const { env } = await loadEnvironment();

    expect(env.databaseUrl).toBe("postgresql://fallback.example.test/postgres");
  });
});
