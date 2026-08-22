import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const configUrl = new URL("../vercel.json", import.meta.url);

describe("Vercel deployment configuration", () => {
  it("keeps API Function requests outside the SPA fallback", () => {
    const config = JSON.parse(readFileSync(configUrl, "utf8")) as {
      buildCommand?: string;
      outputDirectory?: string;
      rewrites?: Array<{ source?: string; destination?: string }>;
    };

    expect(config.buildCommand).toBe("pnpm run vercel-build");
    expect(config.outputDirectory).toBe("dist/public");
    expect(config.rewrites).toContainEqual({
      source: "/:path((?!api(?:/|$)).*)",
      destination: "/index.html",
    });
    expect(config.rewrites?.some((rewrite) => rewrite.source === "/(.*)")).toBe(false);
  });
});
