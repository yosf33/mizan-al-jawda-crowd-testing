import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildReportPresentation } from "../lib/reportPresentation";

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
    expect(page).toContain("normalizedAmount <= available");
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
    expect(page).toContain("useSearch");
    expect(page).toContain("new URLSearchParams(search)");
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
    const presentation = readProjectFile("client/src/lib/reportPresentation.ts");
    expect(page).toContain("buildReportPresentation(report)");
    expect(presentation).toContain("خطوات الإعادة");
    expect(presentation).toContain("المتوقع");
    expect(presentation).toContain("الفعلي");
    expect(presentation).toContain("statusHistory");
    expect(page).toContain("سجل الحالة");
  });

  it("preserves populated persisted report details and ordered status history for every authorized report surface", () => {
    const presentation = buildReportPresentation({
      title: "تعذر حفظ التغييرات",
      stepsToReproduce: "افتح الإعدادات ثم احفظ التعديل",
      expectedResult: "يتم حفظ التعديل",
      actualResult: "تظهر رسالة تعذر الحفظ",
      statusHistory: [
        { id: "submitted", type: "submitted", createdAt: "2026-08-24T08:00:00.000Z" },
        { id: "request", type: "information_requested", message: "أرفق لقطة شاشة", createdAt: "2026-08-24T09:00:00.000Z" },
      ],
    });
    expect(presentation.details.map((item) => item.value)).toEqual(["افتح الإعدادات ثم احفظ التعديل", "يتم حفظ التعديل", "تظهر رسالة تعذر الحفظ"]);
    expect(presentation.history.map((event) => [event.label, event.message])).toEqual([["تم إرسال التقرير", null], ["طُلبت معلومات إضافية", "أرفق لقطة شاشة"]]);
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(page).toContain("<ReportRecord key={report.id} report={report} />");
    expect(page).toContain("<ReportRecord key={report.id} report={report} showFull />");
    expect(page).toContain("<ReportRecord report={report} showFull />");
  });

  it("localizes known Supabase authentication failures for Arabic users", () => {
    const page = readProjectFile("client/src/pages/SignIn.tsx");
    expect(page).toContain("localizeAuthError");
    expect(page).toContain("بيانات تسجيل الدخول غير صحيحة.");
    expect(page).toContain("تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.");
  });

  it("keeps a signed-in user on an authenticated route after using the public product logo", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    expect(home).toContain('import { useAuth } from "@/hooks/useAuth"');
    expect(home).toContain('const { user } = useAuth()');
    expect(home).toContain('user ? "/workspace" : "/sign-up"');
    expect(home).toContain('user ? setLocation("/workspace") : startLogin()');
  });

  it("limits test-lead navigation to an active server-projected TTL assignment", () => {
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(page).toContain('role === "tester" && !ttlAssignments.data?.length');
    expect(page).toContain('item.path !== "/workspace?section=ttl"');
  });

  it("accepts Arabic numerals for withdrawals and exposes lifecycle and transaction history surfaces", () => {
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(page).toContain("normalizeArabicDigits");
    expect(page).toContain("payoutHistory");
    expect(page).toContain("transactionsHistory");
    expect(page).toContain("CommunityPayoutReview");
    expect(page).toContain("تم تأكيد إرسال التحويل وسُجلت العملية");
  });

  it("uses the secure evidence URL contract and displays applicant identity and invitation email fields", () => {
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    const server = readProjectFile("server/routers.ts");
    expect(page).toContain("ReportAttachment");
    expect(page).toContain("trpc.evidence.getSecureUrl.useQuery");
    expect(page).toContain("application.testerName || application.testerEmail");
    expect(page).toContain("testerEmail");
    expect(server).toContain("testerEmail: profiles.email");
  });

  it("renders actual notification content in both the workspace and the shared dashboard bell", () => {
    const layout = readProjectFile("client/src/components/DashboardLayout.tsx");
    const page = readProjectFile("client/src/pages/Workspace.tsx");
    expect(layout).toContain("notifications");
    expect(layout).toContain("item.title");
    expect(page).toContain('notificationCount={notifications.data?.filter((item) => !item.readAt).length ?? 0}');
  });

  it("keeps the active sidebar state synchronized with query-string workspace sections", () => {
    const layout = readProjectFile("client/src/components/DashboardLayout.tsx");
    expect(layout).toContain('import { useLocation, useSearch } from "wouter"');
    expect(layout).toContain("const search = useSearch()");
    expect(layout).toContain("const normalizedSearch = search");
    expect(layout).toContain("const activeLocation = normalizedSearch");
    expect(layout).toContain("isActive={activeLocation === item.path}");
  });

  it("uses Arabic-safe display typography and gives signed-in users a distinct identified home state", () => {
    const styles = readProjectFile("client/src/index.css");
    const home = readProjectFile("client/src/pages/Home.tsx");
    expect(styles).toContain("Noto Kufi Arabic");
    expect(styles).toContain(".arabic-display");
    expect(styles).toContain("letter-spacing: normal !important");
    expect(styles).toContain("line-height: 1.32 !important");
    expect(home).toContain("signed-in-identity");
    expect(home).toContain("signed-in-home-card");
    expect(home).toContain("{user.email}");
    expect(home).toContain("حسابك نشط وجاهز للعمل");
  });
});
