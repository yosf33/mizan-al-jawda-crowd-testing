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

    const { env } = await loadEnvironment();

    expect(env.databaseUrl).toBe("postgresql://primary.example.test/postgres");
  });

  it("rejects a non-PostgreSQL DATABASE_URL rather than using a provider fallback", async () => {
    vi.stubEnv("DATABASE_URL", "mysql://unsupported.example.test/platform");

    const { env } = await loadEnvironment();

    expect(env.databaseUrl).toBe("");
  });
});
