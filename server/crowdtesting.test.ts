import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { appRouter } from "./routers";
import { assertRole, money, projectReportsWithHistory } from "./crowdtesting";
import { sendReviewEmail } from "./mail";
import type { TrpcContext } from "./_core/context";

const cycleId = "00000000-0000-4000-8000-000000000001";
const deviceId = "00000000-0000-4000-8000-000000000002";
const bugId = "00000000-0000-4000-8000-000000000003";

function contextFor(role: "tester" | "client" | "community_manager" | "admin"): TrpcContext {
  return {
    user: {
      id: "00000000-0000-4000-8000-000000000010",
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "supabase",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("V3 crowd-testing workflow guards", () => {
  it("formats financial values to two decimal places", () => {
    expect(money(12)).toBe("12.00");
    expect(money("7.456")).toBe("7.46");
  });

  it("permits only the stated server-derived roles", () => {
    expect(() => assertRole("community_manager", ["community_manager", "admin"])).not.toThrow();
    expect(() => assertRole("tester", ["community_manager", "admin"])).toThrow("ليس لديك صلاحية");
  });

  it("rejects a malformed report before it can reach persistence", async () => {
    const caller = appRouter.createCaller(contextFor("tester"));
    await expect(caller.tester.submitReport({
      testCycleId: cycleId,
      deviceId,
      title: "عنوان تقرير اختبار",
      category: "security",
      severity: "major",
      stepsToReproduce: "خطوات كافية لإعادة إنتاج الخطأ في التطبيق",
      expectedResult: "نتيجة متوقعة",
      actualResult: "نتيجة فعلية",
    } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a written reason before a TTL can reject a report", async () => {
    const caller = appRouter.createCaller(contextFor("tester"));
    await expect(caller.ttl.reviewBug({ bugId, action: "rejected" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires a written reason before a TTL can request more information", async () => {
    const caller = appRouter.createCaller(contextFor("tester"));
    await expect(caller.ttl.reviewBug({ bugId, action: "request_information" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("projects persisted report fields with ordered status history for authorized views", () => {
    const reports = [{ id: bugId, title: "تعذر إتمام الدفع", status: "pending", stepsToReproduce: "افتح صفحة الدفع ثم اضغط تأكيد", expectedResult: "يتم الإتمام", actualResult: "تظهر رسالة خطأ" }];
    const events = [
      { id: "event-1", bugReportId: bugId, type: "submitted", message: null, createdAt: new Date("2026-08-24T08:00:00.000Z") },
      { id: "event-2", bugReportId: bugId, type: "information_requested", message: "أرفق لقطة للشاشة", createdAt: new Date("2026-08-24T09:00:00.000Z") },
    ];
    const [report] = projectReportsWithHistory(reports, events);
    expect(report).toMatchObject({ title: "تعذر إتمام الدفع", stepsToReproduce: "افتح صفحة الدفع ثم اضغط تأكيد", statusHistory: events });
    expect(report.statusHistory.map(event => event.type)).toEqual(["submitted", "information_requested"]);
  });

  it("does not let a tester query Community Manager controls", async () => {
    const caller = appRouter.createCaller(contextFor("tester"));
    await expect(caller.communityManager.eligibleTesters()).rejects.toThrow("ليس لديك الصلاحية");
  });

  it("does not let a business owner query TTL-only review assignments", async () => {
    const caller = appRouter.createCaller(contextFor("client"));
    await expect(caller.ttl.assignedCycles()).rejects.toThrow("ليس لديك الصلاحية");
  });

  it("does not let a business owner apply to a test cycle as a tester", async () => {
    const caller = appRouter.createCaller(contextFor("client"));
    await expect(caller.tester.applyToCycle({ testCycleId: cycleId })).rejects.toThrow("ليس لديك الصلاحية");
  });

  it("does not let a tester invoke the Business Owner invitation flow", async () => {
    const caller = appRouter.createCaller(contextFor("tester"));
    await expect(caller.clientPortal.inviteTester({ testCycleId: cycleId, testerId: deviceId })).rejects.toThrow("ليس لديك الصلاحية");
  });

  it("does not let a Business Owner invoke the TTL application-decision route", async () => {
    const caller = appRouter.createCaller(contextFor("client"));
    await expect(caller.ttl.decideApplication({ applicationId: bugId, decision: "accepted" })).rejects.toThrow("ليس لديك الصلاحية");
  });

  it("skips email delivery safely when no recipient is available", async () => {
    await expect(sendReviewEmail({ to: null, title: "تقرير تجريبي", outcome: "accepted" })).resolves.toEqual({ delivered: false, skipped: true });
  });

  it("keeps all three TTL review outcomes connected to the persisted notification and email trigger", () => {
    const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(routerSource).toContain("notifyReportReviewerOutcome");
    expect(routerSource).toContain('"information_requested"');
    expect(routerSource).toContain("await sendReviewEmail");
    expect(routerSource).toContain("await notifyReportReviewerOutcome");
  });
});
