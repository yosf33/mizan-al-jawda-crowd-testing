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

  it("blocks report and payout actions that have no accepted cycle or available balance", () => {
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(page).toContain("acceptedCycles.length");
    expect(page).toContain("لا توجد دورة مقبولة");
    expect(page).toContain("لا يوجد رصيد قابل للسحب حالياً");
    expect(page).toContain("Number(amount) <= available");
  });

  it("adds dialog descriptions and a named evidence upload control", () => {
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(page).toContain("DialogDescription");
    expect(page).toContain('aria-label="إرفاق أدلة لتقرير الخطأ"');
    expect(page).toContain('id="report-evidence-help"');
  });

  it("renders dedicated workspace sections for navigation and keeps policy destinations as real routes", () => {
    const layout = readProjectFile("client/src/components/DashboardLayout.tsx");
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    const home = readProjectFile("client/src/pages/Home.tsx");
    const app = readProjectFile("client/src/App.tsx");
    expect(layout).toContain("scrollIntoView");
    expect(page).toContain('path: "/workspace?section=reports"');
    expect(page).toContain('path: "/workspace?section=wallet"');
    expect(page).toContain('section === "reports"');
    expect(page).toContain('section === "wallet"');
    expect(page).toContain("TesterReportsView");
    expect(page).toContain("TesterWalletView");
    expect(home).toContain('href="/policies#privacy"');
    expect(home).toContain('href="/policies#terms"');
    expect(home).toContain('href="/policies#evidence"');
    expect(app).toContain('path="/policies"');
  });

  it("renders the persisted saved-data and status-history affordances in authorized report records", () => {
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(page).toContain("خطوات الإعادة");
    expect(page).toContain("المتوقع");
    expect(page).toContain("الفعلي");
    expect(page).toContain("report.statusHistory");
    expect(page).toContain("سجل الحالة");
  });

  it("localizes known Supabase authentication failures for Arabic users", () => {
    const page = readProjectFile("client/src/pages/SignIn.tsx");
    expect(page).toContain("localizeAuthError");
    expect(page).toContain("بيانات تسجيل الدخول غير صحيحة.");
    expect(page).toContain("تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.");
  });
});
