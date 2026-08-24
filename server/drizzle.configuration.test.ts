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
  it("requires a PostgreSQL DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "mysql://unsupported.example.test/platform");

    await expect(loadDrizzleConfiguration()).rejects.toThrow("A PostgreSQL DATABASE_URL is required");
  });

  it("uses the Vercel DATABASE_URL when it is already PostgreSQL", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://vercel.example.test/postgres");

    const { default: configuration } = await loadDrizzleConfiguration();

    expect(configuration.dbCredentials.url).toBe("postgresql://vercel.example.test/postgres");
  });
});
