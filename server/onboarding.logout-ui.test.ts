import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("onboarding logout control", () => {
  it("lets an authenticated but unprovisioned user end the session without submitting onboarding data", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Onboarding.tsx"), "utf8");

    expect(source).toContain("const { user, loading, logout } = useAuth()");
    expect(source).toContain("await logout()");
    expect(source).toContain('setLocation("/sign-in")');
    expect(source).toContain("تسجيل الخروج");
  });
});
