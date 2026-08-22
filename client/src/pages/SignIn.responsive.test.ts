import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectRoot = new URL("../../..", import.meta.url);
const readProjectFile = (relativePath: string) => readFileSync(new URL(relativePath, projectRoot), "utf8");

describe("sign-in responsive layout", () => {
  it("keeps the RTL sign-in form constrained to the viewport", () => {
    const page = readProjectFile("client/src/pages/SignIn.tsx");
    const styles = readProjectFile("client/src/index.css");

    expect(page).toContain('className="sign-in-page min-h-svh');
    expect(page).toContain('className="sign-in-card surface-card');
    expect(styles).toContain(".sign-in-page { display: grid; width: 100%; max-width: 100%; min-width: 0;");
    expect(styles).toContain(".sign-in-card { inline-size: min(100%, 28rem); min-inline-size: 0;");
  });
});
