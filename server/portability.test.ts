import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) => readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("portable Supabase and Vercel runtime", () => {
  it("does not retain the managed-workspace server or client scaffold", () => {
    expect(existsSync(path.join(projectRoot, "server/_core"))).toBe(false);
    expect(existsSync(path.join(projectRoot, "client/src/_core"))).toBe(false);
    expect(existsSync(path.join(projectRoot, "client/public/__manus__"))).toBe(false);
    expect(existsSync(path.join(projectRoot, "client/src/components/Map.tsx"))).toBe(false);
  });

  it("uses only the standard PostgreSQL DATABASE_URL contract", () => {
    const databaseResolver = readProjectFile("server/database-url.ts");

    expect(databaseResolver).toContain('readEnvironment("DATABASE_URL")');
    expect(databaseResolver).not.toContain("SUPABASE_DATABASE_URL");
  });

  it("keeps the active Vercel and Supabase runtime path free of managed-platform imports", () => {
    const activeFiles = [
      "api/vercel-handler.ts",
      "server/app.ts",
      "server/context.ts",
      "server/supabase.ts",
      "server/storage.ts",
      "client/src/lib/supabase.ts",
      "vercel.json",
      "package.json",
    ];

    for (const relativePath of activeFiles) {
      const source = readProjectFile(relativePath).toLowerCase();
      expect(source).not.toContain("/_core/");
      expect(source).not.toContain("@manus");
      expect(source).not.toContain("manus-storage");
    }
  });
});
