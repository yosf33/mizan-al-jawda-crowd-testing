// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ workspace: { dashboard: { invalidate: vi.fn() } } }),
    evidence: { getSecureUrl: { useQuery: () => ({ data: { url: "https://evidence.test/tester-report-image.png" }, isLoading: false }) } },
  },
}));

import { TesterReportsView } from "./Workspace";

const report = {
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
  attachments: [{ id: "attachment-1", originalName: "tester-evidence.png", mimeType: "image/png" }],
};

afterEach(cleanup);

describe("tester saved-report details", () => {
  it("reveals persisted fields and ordered status history through the shipped details button", () => {
    render(createElement(TesterReportsView, { reports: [report], notifications: [] }));
    expect(screen.queryByText("افتح الإعدادات ثم احفظ التعديل")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "عرض البيانات المحفوظة" }));

    expect(screen.getByText("افتح الإعدادات ثم احفظ التعديل")).toBeTruthy();
    expect(screen.getByText("يتم حفظ التعديل")).toBeTruthy();
    expect(screen.getByText("تظهر رسالة تعذر الحفظ")).toBeTruthy();
    expect(screen.getByText("تم إرسال التقرير")).toBeTruthy();
    expect(screen.getByText("طُلبت معلومات إضافية")).toBeTruthy();
    expect(screen.getByText((_, node) => node?.tagName === "LI" && node.textContent?.includes("أرفق لقطة شاشة") === true)).toBeTruthy();
    expect(screen.getByRole("img", { name: "tester-evidence.png" }).getAttribute("src")).toBe("https://evidence.test/tester-report-image.png");
  });
});
