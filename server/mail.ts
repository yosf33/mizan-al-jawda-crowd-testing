import { env } from "./env";

type ReviewEmail = {
  to: string | null;
  title: string;
  outcome: "accepted" | "rejected" | "information_requested";
  reason?: string | null;
};

const outcomeCopy: Record<ReviewEmail["outcome"], string> = {
  accepted: "تم قبول تقريرك من قائد فريق الاختبار.",
  rejected: "تم رفض تقريرك من قائد فريق الاختبار.",
  information_requested: "طلب قائد فريق الاختبار معلومات إضافية عن تقريرك.",
};

/**
 * Sends only transactional review notices. A delivery failure never rolls back
 * a persisted review decision or its in-app notification.
 */
export async function sendReviewEmail(input: ReviewEmail) {
  if (!input.to || !env.resendApiKey || !env.emailFrom) return { delivered: false, skipped: true } as const;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [input.to],
        subject: `ميزان الجودة: تحديث تقرير «${input.title}»`,
        text: [outcomeCopy[input.outcome], input.reason ? `التفاصيل: ${input.reason}` : "", "يمكنك مراجعة تفاصيل التقرير من مساحة العمل."].filter(Boolean).join("\n\n"),
      }),
    });
    if (!response.ok) {
      console.warn("[mail] Review email was not accepted by the provider", { status: response.status });
      return { delivered: false, skipped: false } as const;
    }
    return { delivered: true, skipped: false } as const;
  } catch {
    console.warn("[mail] Review email request failed");
    return { delivered: false, skipped: false } as const;
  }
}
