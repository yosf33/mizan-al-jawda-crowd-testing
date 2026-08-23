import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const projectRoot = new URL("../../..", import.meta.url);
const readProjectFile = (relativePath: string) => readFileSync(new URL(relativePath, projectRoot), "utf8");

describe("referenced crowd-testing regression fixes", () => {
  it("renders deterministic access, setup, and retry states instead of a blank workspace", () => {
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(page).toContain("WorkspaceAccessGate");
    expect(page).toContain("OnboardingGate");
    expect(page).toContain("WorkspaceProfileError");
    expect(page).toContain('setLocation("/onboarding")');
    expect(page).toContain('سجّل دخولك للمتابعة');
  });

  it("blocks report and payout actions that have no eligible cycle or available balance", () => {
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(page).toContain("noActiveCycles");
    expect(page).toContain("لا توجد دورة اختبار نشطة");
    expect(page).toContain("لا يوجد رصيد قابل للسحب حالياً");
    expect(page).toContain("Number(amount) <= available");
  });

  it("adds dialog descriptions and a named evidence upload control", () => {
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(page).toContain("DialogDescription");
    expect(page).toContain('aria-label="إرفاق أدلة لتقرير الخطأ"');
    expect(page).toContain('id="report-evidence-help"');
  });

  it("makes workspace hashes scrollable and policy destinations real routes", () => {
    const layout = readProjectFile("client/src/components/DashboardLayout.tsx");
    const home = readProjectFile("client/src/pages/Home.tsx");
    const app = readProjectFile("client/src/App.tsx");
    expect(layout).toContain("scrollIntoView");
    expect(home).toContain('href="/policies#privacy"');
    expect(home).toContain('href="/policies#terms"');
    expect(home).toContain('href="/policies#evidence"');
    expect(app).toContain('path="/policies"');
  });

  it("localizes known Supabase authentication failures for Arabic users", () => {
    const page = readProjectFile("client/src/pages/SignIn.tsx");
    expect(page).toContain("localizeAuthError");
    expect(page).toContain("بيانات تسجيل الدخول غير صحيحة.");
    expect(page).toContain("تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.");
  });
});
