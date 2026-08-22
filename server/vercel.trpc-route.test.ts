import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel tRPC Function routing", () => {
  it("provides an explicit nested Function entrypoint backed by the bundled handler", () => {
    const entrypoint = resolve(process.cwd(), "api/trpc/[procedure].ts");

    expect(existsSync(entrypoint)).toBe(true);
    expect(readFileSync(entrypoint, "utf8")).toContain('import handler from "../vercel-handler.js"');
  });
});
