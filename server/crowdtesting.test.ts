import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { assertRole, money } from "./crowdtesting";
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

  it("does not let a tester query Community Manager controls", async () => {
    const caller = appRouter.createCaller(contextFor("tester"));
    await expect(caller.communityManager.eligibleTesters()).rejects.toThrow("ليس لديك الصلاحية");
  });

  it("does not let a business owner query TTL-only review assignments", async () => {
    const caller = appRouter.createCaller(contextFor("client"));
    await expect(caller.ttl.assignedCycles()).rejects.toThrow("ليس لديك الصلاحية");
  });

  it("skips email delivery safely when no recipient is available", async () => {
    await expect(sendReviewEmail({ to: null, title: "تقرير تجريبي", outcome: "accepted" })).resolves.toEqual({ delivered: false, skipped: true });
  });
});
