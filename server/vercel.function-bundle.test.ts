import { build } from "esbuild";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("Vercel Function bundle", () => {
  it("bundles the shared Express application without a source-only server import", async () => {
    const directory = mkdtempSync(join(tmpdir(), "mizan-vercel-function-"));
    temporaryDirectories.push(directory);
    const outfile = join(directory, "vercel-handler.js");

    await build({
      bundle: true,
      entryPoints: [resolve(process.cwd(), "api/vercel-handler.ts")],
      format: "esm",
      logLevel: "silent",
      outfile,
      packages: "external",
      platform: "node",
    });

    const output = readFileSync(outfile, "utf8");
    expect(output).toContain("function createApp()");
    expect(output).not.toMatch(/from\s+["']\.\.\/server\/app["']/);
  });
});
