import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { dashboard: { invalidate: vi.fn() } } }),
    evidence: { getSecureUrl: { useQuery: () => ({ data: { url: "https://evidence.test/report-image.png" }, isLoading: false }) } },
    communityManager: {
      processPayout: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
    clientPortal: {
      eligibleTesters: { useQuery: () => ({ data: [], isLoading: false }) },
      inviteTester: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      cycleApplications: { useQuery: () => ({ data: [] }) },
      decideApplication: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));

import { ClientWorkspace, ClientWorkspaceV2, CommunityManagerWorkspaceV2, TesterReportsView, TtlReviewCard } from "./Workspace";

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
  attachments: [{ id: "attachment-1", originalName: "evidence.png", mimeType: "image/png" }],
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

  it("renders the authorized signed image-evidence path for the assigned TTL and Business Owner report surfaces", () => {
    const ttlMarkup = renderToStaticMarkup(createElement(TtlReviewCard, { report: persistedReport, busy: false, onReview: () => undefined }));
    const ownerMarkup = renderToStaticMarkup(createElement(ClientWorkspace, { data: { projects: [], cycles: [], acceptedReports: [persistedReport] }, notifications: [] }));
    expect(ttlMarkup).toContain('src="https://evidence.test/report-image.png"');
    expect(ownerMarkup).toContain('src="https://evidence.test/report-image.png"');
    expect(ttlMarkup).toContain('alt="evidence.png"');
    expect(ownerMarkup).toContain('alt="evidence.png"');
  });

  it("keeps detailed Client and Community Manager records out of their overview while retaining them in their dedicated sections", () => {
    const clientData = { projects: [{ id: "project-1", name: "مشروع الجودة", description: "تفاصيل المشروع" }], cycles: [{ id: "cycle-1", title: "دورة الجودة", status: "active" }], acceptedReports: [persistedReport] };
    const clientOverview = renderToStaticMarkup(createElement(ClientWorkspaceV2, { data: clientData, notifications: [], section: "overview" }));
    const clientReports = renderToStaticMarkup(createElement(ClientWorkspaceV2, { data: clientData, notifications: [], section: "accepted-reports" }));
    expect(clientOverview).not.toContain("تعذر حفظ التغييرات");
    expect(clientReports).toContain("تعذر حفظ التغييرات");

    const managerData = { pendingPayouts: [{ id: "payout-1", testerEmail: "tester@example.com", amount: "50.00", method: "instapay", paymentTargetInfo: "test target" }], transactionsHistory: [{ id: "transaction-1", testerEmail: "tester@example.com", amount: "0.00", type: "payout_sent", note: "transfer ref", createdAt: "2026-08-24T08:00:00.000Z" }] };
    const managerOverview = renderToStaticMarkup(createElement(CommunityManagerWorkspaceV2, { data: managerData, section: "overview" }));
    const managerPayouts = renderToStaticMarkup(createElement(CommunityManagerWorkspaceV2, { data: managerData, section: "payouts" }));
    expect(managerOverview).not.toContain("tester@example.com");
    expect(managerPayouts).toContain("tester@example.com");
    expect(managerPayouts).toContain("تم إرسال التحويل");
  });
});
