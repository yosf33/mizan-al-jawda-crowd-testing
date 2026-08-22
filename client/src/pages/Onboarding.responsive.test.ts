import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectRoot = new URL("../../..", import.meta.url);
const page = readFileSync(new URL("client/src/pages/Onboarding.tsx", projectRoot), "utf8");

describe("onboarding responsive layout", () => {
  it("constrains both unauthenticated and authenticated onboarding cards to the mobile viewport", () => {
    const styles = readFileSync(new URL("client/src/index.css", projectRoot), "utf8");

    expect(page).toContain('className="onboarding-page min-h-screen grid place-items-center');
    expect(page).toContain('className="onboarding-guest-card surface-card p-8 text-center"');
    expect(page).toContain('relative mx-auto grid w-full min-w-0 max-w-5xl');
    expect(page).toContain('className="min-w-0 p-7 md:p-11"');
    expect(styles).toContain('.onboarding-page { inline-size: 100%; max-inline-size: 100%; min-inline-size: 0;');
    expect(styles).toContain('.onboarding-guest-card { width: calc(100vw - 3rem); max-width: 28rem; min-width: 0; margin-inline: auto;');
  });
});
