import { beforeEach, describe, expect, it, vi } from "vitest";

const getDb = vi.fn();
const hasServerConfiguration = vi.fn();

vi.mock("./db", () => ({ getDb }));
vi.mock("./env", () => ({ hasServerConfiguration }));

const { databaseHealthPayload } = await import("./health");

describe("database health payload", () => {
  beforeEach(() => {
    getDb.mockReset();
    hasServerConfiguration.mockReset();
  });

  it("does not query a database when runtime configuration is unavailable", async () => {
    hasServerConfiguration.mockReturnValue(false);

    await expect(databaseHealthPayload()).resolves.toMatchObject({ configured: false, database: "unavailable", ok: false });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns a data-free ready response after a successful minimal query", async () => {
    hasServerConfiguration.mockReturnValue(true);
    const execute = vi.fn().mockResolvedValue([]);
    getDb.mockReturnValue({ execute });

    await expect(databaseHealthPayload()).resolves.toMatchObject({ configured: true, database: "ready", ok: true });
    expect(execute).toHaveBeenCalledOnce();
  });

  it("does not expose database errors through the health response", async () => {
    hasServerConfiguration.mockReturnValue(true);
    getDb.mockReturnValue({ execute: vi.fn().mockRejectedValue(new Error("credential details must remain private")) });

    await expect(databaseHealthPayload()).resolves.toEqual({ configured: true, database: "unavailable", ok: false, service: "mizan-al-jawda" });
  });
});
