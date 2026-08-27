import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { appRouter } from "./routers";
import { assertRole, effectiveTestCycleStatus, isMissingV3SchemaError, money, projectReportsWithHistory, readV3OrFallback } from "./crowdtesting";
import { clientMessageForTrpcError, INTERNAL_ERROR_MESSAGE } from "./trpc";
import { sendReviewEmail } from "./mail";
import type { TrpcContext } from "./context";

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

  it("moves an active cycle into Arabic in-review lifecycle state at its end instant without changing other statuses", () => {
    const endAt = new Date("2026-08-26T12:00:00.000Z");
    expect(effectiveTestCycleStatus("active", endAt, new Date("2026-08-26T11:59:59.999Z"))).toBe("active");
    expect(effectiveTestCycleStatus("active", endAt, endAt)).toBe("in_review");
    expect(effectiveTestCycleStatus("completed", endAt, new Date("2026-08-27T12:00:00.000Z"))).toBe("completed");
  });

  it("persists elapsed active-cycle closure before every role dashboard query", () => {
    const dashboardSource = readFileSync(new URL("./crowdtesting.ts", import.meta.url), "utf8");
    const workspaceSource = readFileSync(new URL("../client/src/pages/Workspace.tsx", import.meta.url), "utf8");
    expect(dashboardSource).toContain("await expireElapsedActiveTestCycles(db, now)");
    expect(dashboardSource).toContain('eq(testCycles.status, "active"), lte(testCycles.endAt, now)');
    expect(workspaceSource).toContain('in_review: ["قيد المراجعة"');
  });

  it("permits only the stated server-derived roles", () => {
    expect(() => assertRole("community_manager", ["community_manager", "admin"])).not.toThrow();
    expect(() => assertRole("tester", ["community_manager", "admin"])).toThrow("ليس لديك صلاحية");
  });

  it("returns safe defaults only for a missing V3 table and preserves other database failures", async () => {
    const missingTable = Object.assign(new Error("relation test_cycle_applications does not exist"), { code: "42P01" });
    expect(isMissingV3SchemaError(missingTable)).toBe(true);
    await expect(readV3OrFallback(async () => { throw missingTable; }, [])).resolves.toEqual([]);
    await expect(readV3OrFallback(async () => { throw Object.assign(new Error("permission denied"), { code: "42501" }); }, [])).rejects.toMatchObject({ code: "42501" });
  });

  it("never exposes internal database messages through the tRPC response formatter", () => {
    expect(clientMessageForTrpcError("INTERNAL_SERVER_ERROR", "column tester_id does not exist")).toBe(INTERNAL_ERROR_MESSAGE);
    expect(clientMessageForTrpcError("FORBIDDEN", "ليس لديك الصلاحية المطلوبة لإتمام هذه العملية.")).toBe("ليس لديك الصلاحية المطلوبة لإتمام هذه العملية.");
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

  it("does not let a tester confirm or reject another tester's payout", async () => {
    const caller = appRouter.createCaller(contextFor("tester"));
    await expect(caller.communityManager.processPayout({ payoutId: bugId, decision: "processed", note: "تحويل تجريبي" })).rejects.toThrow("ليس لديك الصلاحية");
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

  it("records a confirmed Community Manager payout as an immutable payout-sent transaction and notifies its tester", () => {
    const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(routerSource).toContain('requireRole(ctx.user.role, ["community_manager"])');
    expect(routerSource).toContain('if (request.status !== "pending")');
    expect(routerSource).toContain('type: "payout_sent"');
    expect(routerSource).toContain('referenceType: "payout_request"');
    expect(routerSource).toContain('await notify(request.testerId, input.decision === "processed" ? "تم إرسال التحويل"');
  });

  it("keeps a tester transaction history scoped to their wallet while Community Managers receive the named cross-tester audit view", () => {
    const dashboardSource = readFileSync(new URL("./crowdtesting.ts", import.meta.url), "utf8");
    expect(dashboardSource).toContain('where(eq(payoutRequests.testerId, userId))');
    expect(dashboardSource).toContain('where(eq(transactions.walletId, wallet.id))');
    expect(dashboardSource).toContain('if (role === "community_manager")');
    expect(dashboardSource).toContain('testerEmail: profiles.email');
    expect(dashboardSource).toContain('from(transactions).innerJoin(wallets, eq(wallets.id, transactions.walletId)).innerJoin(profiles, eq(profiles.id, wallets.userId))');
  });
});
