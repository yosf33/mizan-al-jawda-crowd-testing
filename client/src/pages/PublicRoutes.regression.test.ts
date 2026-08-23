import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectRoot = new URL("../../..", import.meta.url);
const readProjectFile = (relativePath: string) => readFileSync(new URL(relativePath, projectRoot), "utf8");

describe("public workspace and policy routes", () => {
  it("renders a visible sign-in gate for anonymous workspace visits", () => {
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(page).toContain("WorkspaceAccessGate");
    expect(page).toContain("سجّل دخولك للمتابعة");
    expect(page).toContain('window.location.assign("/sign-in")');
  });

  it("exposes anchorable policy destinations through the footer and router", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    const app = readProjectFile("client/src/App.tsx");
    const policies = readProjectFile("client/src/pages/Policies.tsx");
    expect(home).toContain('href="/policies#privacy"');
    expect(home).toContain('href="/policies#terms"');
    expect(home).toContain('href="/policies#evidence"');
    expect(app).toContain('path="/policies"');
    expect(policies).toContain('id: "privacy"');
  });
});

