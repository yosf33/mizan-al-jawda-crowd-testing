import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { dashboard: { invalidate: vi.fn() } } }),
    clientPortal: {
      eligibleTesters: { useQuery: () => ({ data: [], isLoading: false }) },
      inviteTester: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      cycleApplications: { useQuery: () => ({ data: [] }) },
      decideApplication: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));

import { ClientWorkspace, TesterReportsView, TtlReviewCard } from "./Workspace";

const persistedReport = {
  id: "report-1",
  title: "تعذر حفظ التغييرات",
  category: "functional",
  severity: "major",
  createdAt: "2026-08-24T08:00:00.000Z",
  status: "pending",
  stepsToReproduce: "افتح الإعدادات ثم احفظ التعديل",
  expectedResult: "يتم حفظ التعديل",
  actualResult: "تظهر رسالة تعذر الحفظ",
  statusHistory: [
    { id: "event-1", type: "submitted", createdAt: "2026-08-24T08:00:00.000Z" },
    { id: "event-2", type: "information_requested", message: "أرفق لقطة شاشة", createdAt: "2026-08-24T09:00:00.000Z" },
  ],
};

function expectPersistedReport(markup: string) {
  expect(markup).toContain("افتح الإعدادات ثم احفظ التعديل");
  expect(markup).toContain("يتم حفظ التعديل");
  expect(markup).toContain("تظهر رسالة تعذر الحفظ");
  expect(markup).toContain("تم إرسال التقرير");
  expect(markup).toContain("طُلبت معلومات إضافية");
  expect(markup).toContain("أرفق لقطة شاشة");
  expect(markup.indexOf("تم إرسال التقرير")).toBeLessThan(markup.indexOf("طُلبت معلومات إضافية"));
}

describe("V3 populated report views", () => {
  it("renders persisted tester report details and status history", () => {
    expectPersistedReport(renderToStaticMarkup(createElement(TtlReviewCard, { report: persistedReport, busy: false, onReview: () => undefined })));
  });

  it("renders accepted Business Owner report details and status history", () => {
    expectPersistedReport(renderToStaticMarkup(createElement(ClientWorkspace, { data: { projects: [], cycles: [], acceptedReports: [persistedReport] }, notifications: [] })));
  });

  it("renders assigned TTL review report details and status history", () => {
    expectPersistedReport(renderToStaticMarkup(createElement(TtlReviewCard, { report: persistedReport, busy: false, onReview: () => undefined })));
  });
});
