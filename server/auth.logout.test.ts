import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./context";

describe("auth.logout", () => {
  it("returns success without manipulating a server-managed cookie", async () => {
    const ctx: TrpcContext = {
      user: { id: "c2da7034-2644-4ca1-968e-745447b5c1f6", email: "tester@example.com", role: "tester", name: "Tester" },
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(caller.auth.logout()).resolves.toEqual({ success: true });
  });
});
