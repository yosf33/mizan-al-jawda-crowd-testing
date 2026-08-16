import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { assertRole, money } from "./crowdtesting";
import type { TrpcContext } from "./_core/context";

function contextFor(role: "tester" | "client" | "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("crowd-testing workflow guards", () => {
  it("formats financial values to two decimal places", () => {
    expect(money(12)).toBe("12.00");
    expect(money("7.456")).toBe("7.46");
  });

  it("permits only the stated allowed roles", () => {
    expect(() => assertRole("tester", ["tester", "admin"])).not.toThrow();
    expect(() => assertRole("client", ["tester", "admin"])).toThrow("ليس لديك صلاحية");
  });

  it("requires a written reason before a client can reject a bug", async () => {
    const caller = appRouter.createCaller(contextFor("client"));
    await expect(caller.clientPortal.decideBug({ bugId: 1, decision: "reject" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("requires both an original reference and a written reason when triaging a duplicate", async () => {
    const caller = appRouter.createCaller(contextFor("admin"));
    await expect(caller.admin.triageBug({ bugId: 1, action: "mark_duplicate", reason: "سبب واضح يشرح التكرار" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects bug reports with categories outside the exact permitted set", async () => {
    const caller = appRouter.createCaller(contextFor("tester"));
    await expect(caller.tester.submitReport({ testCycleId: 1, deviceId: 1, title: "عنوان تقرير اختبار", category: "security", severity: "major", stepsToReproduce: "خطوات كافية لإعادة إنتاج الخطأ في التطبيق", expectedResult: "نتيجة متوقعة", actualResult: "نتيجة فعلية" } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
