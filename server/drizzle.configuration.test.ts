import { afterEach, describe, expect, it, vi } from "vitest";

async function loadDrizzleConfiguration() {
  vi.resetModules();
  return import("../drizzle.config");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Drizzle PostgreSQL configuration", () => {
  it("uses the PostgreSQL fallback instead of a managed local MySQL DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "mysql://managed.example.test/platform");
    vi.stubEnv("SUPABASE_DATABASE_URL", "postgresql://pooler.example.test/postgres");

    const { default: configuration } = await loadDrizzleConfiguration();

    expect(configuration.dbCredentials.url).toBe("postgresql://pooler.example.test/postgres");
  });

  it("uses the Vercel DATABASE_URL when it is already PostgreSQL", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://vercel.example.test/postgres");
    vi.stubEnv("SUPABASE_DATABASE_URL", "postgresql://fallback.example.test/postgres");

    const { default: configuration } = await loadDrizzleConfiguration();

    expect(configuration.dbCredentials.url).toBe("postgresql://vercel.example.test/postgres");
  });
});
