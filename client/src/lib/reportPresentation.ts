export type PersistedReportEvent = {
  id?: string;
  type?: string;
  message?: string | null;
  createdAt?: unknown;
};

export type PersistedReportInput = {
  title?: string;
  stepsToReproduce?: string | null;
  expectedResult?: string | null;
  actualResult?: string | null;
  statusHistory?: PersistedReportEvent[] | null;
};

export function reportEventLabel(type?: string) {
  if (type === "submitted") return "تم إرسال التقرير";
  if (type === "information_requested") return "طُلبت معلومات إضافية";
  if (type === "accepted") return "تم قبول التقرير";
  if (type === "rejected") return "تم رفض التقرير";
  return type ?? "تحديث الحالة";
}

export function buildReportPresentation(report: PersistedReportInput) {
  return {
    title: report.title ?? "تقرير خطأ",
    details: [
      { id: "steps", label: "خطوات الإعادة", value: report.stepsToReproduce ?? "—" },
      { id: "expected", label: "المتوقع", value: report.expectedResult ?? "—" },
      { id: "actual", label: "الفعلي", value: report.actualResult ?? "—" },
    ],
    history: (report.statusHistory ?? []).map((event, index) => ({
      id: event.id ?? `report-event-${index}`,
      label: reportEventLabel(event.type),
      message: event.message ?? null,
      createdAt: event.createdAt,
    })),
  };
}
