import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel nested Function routing", () => {
  it.each([
    ["tRPC procedures", "api/trpc/[procedure].ts"],
    ["database readiness", "api/health/[probe].ts"],
  ])("provides a bundled nested Function entrypoint for %s", (_name, file) => {
    const entrypoint = resolve(process.cwd(), file);

    expect(existsSync(entrypoint)).toBe(true);
    expect(readFileSync(entrypoint, "utf8")).toContain('import handler from "../vercel-handler.js"');
  });
});
