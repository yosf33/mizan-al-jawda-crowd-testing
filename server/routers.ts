import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  bugAttachments, bugReportEvents, bugReports, cycleBountyRates, notifications, payoutRequests, profiles, reputationEvents,
  projects, testCycleApplications, testCycleInvitations, testCycleTtls, testerDevices, testerProfiles, testCycles, transactions, wallets,
} from "../drizzle/schema";
import { dashboardFor, isActiveCycleTtl, money, notify, projectReportsWithHistory } from "./crowdtesting";
import { getDb } from "./db";
import { sendReviewEmail } from "./mail";
import { storageGetSignedUrl, storagePut } from "./storage";
import { protectedProcedure, publicProcedure, router } from "./trpc";

const payoutMethods = ["instapay", "vodafone_cash", "paypal", "bank_transfer"] as const;
const categoryValues = ["functional", "ui", "performance", "crash"] as const;
const severityValues = ["critical", "major", "minor"] as const;
const uuid = z.string().uuid();

function fail(message: string, code: "FORBIDDEN" | "BAD_REQUEST" | "NOT_FOUND" | "CONFLICT" = "BAD_REQUEST"): never {
  throw new TRPCError({ code, message });
}
function requireRole(role: string, roles: string[]) {
  if (!roles.includes(role)) fail("ليس لديك الصلاحية المطلوبة لإتمام هذه العملية.", "FORBIDDEN");
}
function dbOrFail() {
  const db = getDb();
  if (!db) fail("تعذر الاتصال بقاعدة البيانات. تحقق من إعدادات Supabase.", "CONFLICT");
  return db;
}
async function getBug(id: string) {
  const [bug] = await dbOrFail().select().from(bugReports).where(eq(bugReports.id, id)).limit(1);
  if (!bug) fail("لم يتم العثور على تقرير الخطأ.", "NOT_FOUND");
  return bug;
}
async function ownedCycle(db: any, clientId: string, testCycleId: string) {
  const [cycle] = await db.select({ id: testCycles.id, title: testCycles.title, projectId: testCycles.projectId })
    .from(testCycles).innerJoin(projects, eq(projects.id, testCycles.projectId))
    .where(and(eq(testCycles.id, testCycleId), eq(projects.clientId, clientId))).limit(1);
  if (!cycle) fail("دورة الاختبار غير متاحة ضمن مشاريعك.", "FORBIDDEN");
  return cycle;
}
async function assertApplicationDecisionAuthority(db: any, userId: string, role: string, testCycleId: string) {
  if (role === "client") return ownedCycle(db, userId, testCycleId);
  if (role === "tester") {
    const [assignment] = await db.select({ id: testCycleTtls.id }).from(testCycleTtls)
      .where(and(eq(testCycleTtls.testCycleId, testCycleId), eq(testCycleTtls.testerId, userId), isNull(testCycleTtls.revokedAt))).limit(1);
    if (assignment) return { id: testCycleId };
  }
  fail("يمكن لمالك المشروع أو قائد فريق الاختبار المعيّن فقط اتخاذ قرار في طلب الانضمام.", "FORBIDDEN");
}
async function notifyReportReviewerOutcome(testerId: string, bugId: string, title: string, outcome: "accepted" | "rejected" | "information_requested", reason?: string) {
  const copy = outcome === "accepted"
    ? { title: "تم قبول تقريرك", body: "قبل قائد فريق الاختبار تقريرك." }
    : outcome === "rejected"
      ? { title: "تم رفض تقريرك", body: `سبب الرفض: ${reason}` }
      : { title: "مطلوب معلومات إضافية", body: reason ?? "طلب قائد فريق الاختبار تفاصيل إضافية." };
  try {
    await notify(testerId, copy.title, copy.body, "bug_report", bugId);
    const [tester] = await dbOrFail().select({ email: profiles.email }).from(profiles).where(eq(profiles.id, testerId)).limit(1);
    await sendReviewEmail({ to: tester?.email ?? null, title, outcome, reason });
  } catch {
    console.warn("[notifications] Review decision was saved but a notification could not be delivered");
  }
}

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(() => ({ success: true } as const)),
  }),
  account: router({
    profile: protectedProcedure.query(async ({ ctx }) => (await dbOrFail().select().from(profiles).where(eq(profiles.id, ctx.user.id)).limit(1))[0] ?? null),
    onboarding: protectedProcedure.input(z.object({
      role: z.enum(["tester", "client"]), country: z.string().max(80).optional(), phoneNumber: z.string().max(32).optional(), payoutMethod: z.enum(payoutMethods).optional(), payoutDetails: z.string().max(300).optional(),
      device: z.object({ deviceType: z.enum(["mobile", "desktop", "tablet"]), brandModel: z.string().min(2).max(180), osName: z.enum(["android", "ios", "windows", "macos", "linux"]), osVersion: z.string().min(1).max(60) }).optional(),
    })).mutation(async ({ ctx, input }) => {
      if (input.role === "tester" && (!input.device || !input.payoutMethod || !input.payoutDetails)) fail("أكمل بيانات الجهاز وطريقة التحويل للانضمام كمختبر.");
      const db = dbOrFail();
      await db.transaction(async tx => {
        await tx.update(profiles).set({ role: input.role, updatedAt: new Date() }).where(eq(profiles.id, ctx.user.id));
        if (input.role === "tester") {
          await tx.insert(testerProfiles).values({ userId: ctx.user.id, country: input.country ?? null, phoneNumber: input.phoneNumber ?? null, payoutMethod: input.payoutMethod!, payoutDetails: input.payoutDetails!, completedAt: new Date() }).onConflictDoUpdate({ target: testerProfiles.userId, set: { country: input.country ?? null, phoneNumber: input.phoneNumber ?? null, payoutMethod: input.payoutMethod!, payoutDetails: input.payoutDetails!, completedAt: new Date() } });
          await tx.insert(wallets).values({ userId: ctx.user.id }).onConflictDoNothing();
          const [existing] = await tx.select({ id: testerDevices.id }).from(testerDevices).where(and(eq(testerDevices.testerId, ctx.user.id), eq(testerDevices.brandModel, input.device!.brandModel))).limit(1);
          if (!existing) await tx.insert(testerDevices).values({ testerId: ctx.user.id, ...input.device! });
        }
      });
      return { success: true, role: input.role };
    }),
  }),
  workspace: router({ dashboard: protectedProcedure.query(({ ctx }) => dashboardFor(ctx.user.role, ctx.user.id)) }),
  tester: router({
    addDevice: protectedProcedure.input(z.object({ deviceType: z.enum(["mobile", "desktop", "tablet"]), brandModel: z.string().min(2).max(180), osName: z.enum(["android", "ios", "windows", "macos", "linux"]), osVersion: z.string().min(1).max(60) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]);
      const [device] = await dbOrFail().insert(testerDevices).values({ testerId: ctx.user.id, ...input }).returning({ id: testerDevices.id });
      return { success: true, id: device.id };
    }),
    applyToCycle: protectedProcedure.input(z.object({ testCycleId: uuid })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]);
      const db = dbOrFail();
      const [tester] = await db.select({ userId: testerProfiles.userId }).from(testerProfiles).where(and(eq(testerProfiles.userId, ctx.user.id), isNotNull(testerProfiles.completedAt))).limit(1);
      if (!tester) fail("أكمل ملف المختبر قبل التقدم إلى دورة اختبار.", "FORBIDDEN");
      const [cycle] = await db.select({ id: testCycles.id }).from(testCycles).where(and(eq(testCycles.id, input.testCycleId), eq(testCycles.status, "active"), lte(testCycles.startAt, new Date()), sql`${testCycles.endAt} >= now()`)).limit(1);
      if (!cycle) fail("دورة الاختبار غير متاحة للتقديم حالياً.");
      const [existing] = await db.select().from(testCycleApplications).where(and(eq(testCycleApplications.testCycleId, input.testCycleId), eq(testCycleApplications.testerId, ctx.user.id))).limit(1);
      if (existing && existing.status !== "rejected") fail("لديك طلب قائم أو مقبول لهذه الدورة.", "CONFLICT");
      if (existing) await db.update(testCycleApplications).set({ status: "pending", appliedAt: new Date(), decidedAt: null, decidedBy: null, decisionReason: null }).where(eq(testCycleApplications.id, existing.id));
      else await db.insert(testCycleApplications).values({ testCycleId: input.testCycleId, testerId: ctx.user.id });
      await db.update(testCycleInvitations).set({ status: "applied", respondedAt: new Date() }).where(and(eq(testCycleInvitations.testCycleId, input.testCycleId), eq(testCycleInvitations.testerId, ctx.user.id), eq(testCycleInvitations.status, "pending")));
      return { success: true, status: "pending" as const };
    }),
    cycleDetails: protectedProcedure.input(z.object({ testCycleId: uuid })).query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]);
      const db = dbOrFail();
      const [application] = await db.select({ id: testCycleApplications.id }).from(testCycleApplications)
        .where(and(eq(testCycleApplications.testCycleId, input.testCycleId), eq(testCycleApplications.testerId, ctx.user.id), eq(testCycleApplications.status, "accepted"))).limit(1);
      if (!application) fail("لا تتاح تفاصيل الدورة إلا للمختبر الذي قُبل طلب انضمامه.", "FORBIDDEN");
      const [cycle] = await db.select({ id: testCycles.id, title: testCycles.title, scopeDescription: testCycles.scopeDescription, outOfScope: testCycles.outOfScope, buildUrl: testCycles.buildUrl, status: testCycles.status, startAt: testCycles.startAt, endAt: testCycles.endAt, projectName: projects.name })
        .from(testCycles).innerJoin(projects, eq(projects.id, testCycles.projectId)).where(eq(testCycles.id, input.testCycleId)).limit(1);
      if (!cycle) fail("دورة الاختبار غير موجودة.", "NOT_FOUND");
      const rates = await db.select({ severity: cycleBountyRates.severity, bountyAmount: cycleBountyRates.bountyAmount }).from(cycleBountyRates).where(eq(cycleBountyRates.testCycleId, input.testCycleId));
      return { ...cycle, rates };
    }),
    submitReport: protectedProcedure.input(z.object({ testCycleId: uuid, deviceId: uuid, title: z.string().min(5).max(240), category: z.enum(categoryValues), severity: z.enum(severityValues), stepsToReproduce: z.string().min(10).max(12000), expectedResult: z.string().min(5).max(6000), actualResult: z.string().min(5).max(6000), attachmentIds: z.array(uuid).max(12).default([]) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]);
      const db = dbOrFail();
      const [device] = await db.select().from(testerDevices).where(and(eq(testerDevices.id, input.deviceId), eq(testerDevices.testerId, ctx.user.id))).limit(1);
      if (!device) fail("الجهاز المحدد غير مسجل في حسابك.", "FORBIDDEN");
      const [application] = await db.select({ id: testCycleApplications.id }).from(testCycleApplications).where(and(eq(testCycleApplications.testCycleId, input.testCycleId), eq(testCycleApplications.testerId, ctx.user.id), eq(testCycleApplications.status, "accepted"))).limit(1);
      if (!application) fail("لا يمكنك إرسال تقرير قبل قبول طلب انضمامك إلى دورة الاختبار.", "FORBIDDEN");
      const [cycle] = await db.select({ id: testCycles.id }).from(testCycles).where(and(eq(testCycles.id, input.testCycleId), eq(testCycles.status, "active"), lte(testCycles.startAt, new Date()), sql`${testCycles.endAt} >= now()`)).limit(1);
      if (!cycle) fail("دورة الاختبار غير متاحة حالياً.");
      const bugId = await db.transaction(async tx => {
        const { attachmentIds, ...report } = input;
        const [created] = await tx.insert(bugReports).values({ ...report, testerId: ctx.user.id, status: "pending" }).returning({ id: bugReports.id });
        await tx.insert(bugReportEvents).values({ bugReportId: created.id, actorId: ctx.user.id, type: "submitted" });
        if (attachmentIds.length) await tx.update(bugAttachments).set({ bugReportId: created.id }).where(and(inArray(bugAttachments.id, attachmentIds), eq(bugAttachments.uploadedBy, ctx.user.id), sql`${bugAttachments.bugReportId} is null`));
        return created.id;
      });
      return { success: true, bugId, message: "تم إرسال تقرير الخطأ وبات بانتظار مراجعة قائد فريق الاختبار." };
    }),
    uploadEvidence: protectedProcedure.input(z.object({ filename: z.string().min(1).max(180), mimeType: z.enum(["image/png", "image/jpeg", "video/mp4", "text/plain", "application/zip"]), base64: z.string().min(4).max(16_000_000) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]);
      const raw = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
      if (!raw.length || raw.length > 10 * 1024 * 1024) fail("يجب ألا يتجاوز حجم الملف 10 ميغابايت.");
      const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `private/${ctx.user.id}/${crypto.randomUUID()}-${safeName}`;
      await storagePut(key, raw, input.mimeType);
      const [attachment] = await dbOrFail().insert(bugAttachments).values({ fileKey: key, originalName: input.filename, mimeType: input.mimeType, sizeBytes: raw.length, uploadedBy: ctx.user.id }).returning({ id: bugAttachments.id });
      return { success: true, attachmentId: attachment.id, name: input.filename };
    }),
    requestPayout: protectedProcedure.input(z.object({ amount: z.number().positive().max(100000), method: z.enum(payoutMethods), paymentTargetInfo: z.string().min(4).max(300) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]);
      const db = dbOrFail();
      const payoutId = await db.transaction(async tx => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ctx.user.id}))`);
        const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, ctx.user.id)).limit(1);
        if (!wallet || Number(wallet.availableBalance) < input.amount) fail("الرصيد المتاح لا يكفي لطلب التحويل.");
        const [request] = await tx.insert(payoutRequests).values({ testerId: ctx.user.id, amount: money(input.amount), method: input.method, paymentTargetInfo: input.paymentTargetInfo }).returning({ id: payoutRequests.id });
        await tx.update(wallets).set({ availableBalance: money(Number(wallet.availableBalance) - input.amount), updatedAt: new Date() }).where(eq(wallets.id, wallet.id));
        await tx.insert(transactions).values({ walletId: wallet.id, amount: money(-input.amount), type: "payout_debit", referenceType: "payout_request", referenceId: request.id, note: "طلب سحب قيد المعالجة" });
        return request.id;
      });
      return { success: true, payoutId };
    }),
  }),
  clientPortal: router({
    createProject: protectedProcedure.input(z.object({ name: z.string().min(3).max(180), description: z.string().min(20).max(8000) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["client"]);
      const [project] = await dbOrFail().insert(projects).values({ ...input, clientId: ctx.user.id }).returning({ id: projects.id });
      return { success: true, projectId: project.id };
    }),
    createCycle: protectedProcedure.input(z.object({ projectId: uuid, title: z.string().min(3).max(180), scopeDescription: z.string().min(20).max(10000), outOfScope: z.string().max(10000).optional(), buildUrl: z.string().url().max(2048), status: z.enum(["draft", "active"]).default("draft"), startAt: z.coerce.date(), endAt: z.coerce.date(), rates: z.object({ critical: z.number().positive(), major: z.number().positive(), minor: z.number().positive() }) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["client"]);
      if (input.endAt <= input.startAt) fail("يجب أن يكون تاريخ الانتهاء بعد تاريخ البداية.");
      const db = dbOrFail();
      const [project] = await db.select().from(projects).where(and(eq(projects.id, input.projectId), eq(projects.clientId, ctx.user.id))).limit(1);
      if (!project) fail("المشروع غير متاح في حسابك.", "FORBIDDEN");
      const cycleId = await db.transaction(async tx => {
        const [cycle] = await tx.insert(testCycles).values({ projectId: input.projectId, title: input.title, scopeDescription: input.scopeDescription, outOfScope: input.outOfScope ?? null, buildUrl: input.buildUrl, status: input.status, startAt: input.startAt, endAt: input.endAt }).returning({ id: testCycles.id });
        await tx.insert(cycleBountyRates).values([{ testCycleId: cycle.id, severity: "critical", bountyAmount: money(input.rates.critical) }, { testCycleId: cycle.id, severity: "major", bountyAmount: money(input.rates.major) }, { testCycleId: cycle.id, severity: "minor", bountyAmount: money(input.rates.minor) }]);
        return cycle.id;
      });
      return { success: true, cycleId };
    }),
    eligibleTesters: protectedProcedure.query(async ({ ctx }) => {
      requireRole(ctx.user.role, ["client"]);
      return dbOrFail().select({ id: profiles.id, name: profiles.name, email: profiles.email, reputationScore: testerProfiles.reputationScore, country: testerProfiles.country })
        .from(profiles).innerJoin(testerProfiles, eq(testerProfiles.userId, profiles.id))
        .where(and(eq(profiles.role, "tester"), isNotNull(testerProfiles.completedAt))).orderBy(desc(testerProfiles.reputationScore));
    }),
    inviteTester: protectedProcedure.input(z.object({ testCycleId: uuid, testerId: uuid.optional(), testerEmail: z.string().email().max(320).optional() }).refine((value) => Boolean(value.testerId || value.testerEmail), "أدخل بريد المختبر أو اختره من القائمة.")).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["client"]);
      const db = dbOrFail();
      await ownedCycle(db, ctx.user.id, input.testCycleId);
      const [tester] = await db.select({ id: profiles.id }).from(profiles).innerJoin(testerProfiles, eq(testerProfiles.userId, profiles.id))
        .where(and(input.testerId ? eq(profiles.id, input.testerId) : eq(profiles.email, input.testerEmail!), eq(profiles.role, "tester"), isNotNull(testerProfiles.completedAt))).limit(1);
      if (!tester) fail("لا يوجد مختبر مكتمل الملف بهذا البريد الإلكتروني.", "NOT_FOUND");
      const [existing] = await db.select().from(testCycleInvitations).where(and(eq(testCycleInvitations.testCycleId, input.testCycleId), eq(testCycleInvitations.testerId, tester.id))).limit(1);
      if (existing) await db.update(testCycleInvitations).set({ invitedBy: ctx.user.id, status: "pending", respondedAt: null }).where(eq(testCycleInvitations.id, existing.id));
      else await db.insert(testCycleInvitations).values({ testCycleId: input.testCycleId, testerId: tester.id, invitedBy: ctx.user.id });
      return { success: true };
    }),
    cycleApplications: protectedProcedure.input(z.object({ testCycleId: uuid })).query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["client"]);
      const db = dbOrFail();
      await ownedCycle(db, ctx.user.id, input.testCycleId);
      return db.select({ id: testCycleApplications.id, testerId: testCycleApplications.testerId, status: testCycleApplications.status, appliedAt: testCycleApplications.appliedAt, decisionReason: testCycleApplications.decisionReason, testerName: profiles.name, testerEmail: profiles.email, reputationScore: testerProfiles.reputationScore })
        .from(testCycleApplications).innerJoin(profiles, eq(profiles.id, testCycleApplications.testerId)).leftJoin(testerProfiles, eq(testerProfiles.userId, profiles.id))
        .where(eq(testCycleApplications.testCycleId, input.testCycleId)).orderBy(desc(testCycleApplications.appliedAt));
    }),
    decideApplication: protectedProcedure.input(z.discriminatedUnion("decision", [z.object({ applicationId: uuid, decision: z.literal("accepted") }), z.object({ applicationId: uuid, decision: z.literal("rejected"), reason: z.string().min(12).max(2000) })])).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["client", "tester"]);
      const db = dbOrFail();
      const [application] = await db.select().from(testCycleApplications).where(eq(testCycleApplications.id, input.applicationId)).limit(1);
      if (!application) fail("طلب الانضمام غير موجود.", "NOT_FOUND");
      await assertApplicationDecisionAuthority(db, ctx.user.id, ctx.user.role, application.testCycleId);
      if (application.status !== "pending") fail("تم اتخاذ قرار في هذا الطلب مسبقاً.", "CONFLICT");
      await db.update(testCycleApplications).set({ status: input.decision, decidedBy: ctx.user.id, decidedAt: new Date(), decisionReason: input.decision === "rejected" ? input.reason : null }).where(eq(testCycleApplications.id, application.id));
      await notify(application.testerId, input.decision === "accepted" ? "تم قبول طلب انضمامك" : "تم رفض طلب انضمامك", input.decision === "accepted" ? "أصبحت مؤهلاً لإرسال تقارير في دورة الاختبار." : `سبب الرفض: ${input.reason}`, "test_cycle_application", application.id);
      return { success: true };
    }),
  }),
  ttl: router({
    assignedCycles: protectedProcedure.query(async ({ ctx }) => {
      requireRole(ctx.user.role, ["tester"]);
      return dbOrFail().select({ id: testCycles.id, title: testCycles.title, projectName: projects.name, status: testCycles.status })
        .from(testCycleTtls).innerJoin(testCycles, eq(testCycles.id, testCycleTtls.testCycleId)).innerJoin(projects, eq(projects.id, testCycles.projectId))
        .where(and(eq(testCycleTtls.testerId, ctx.user.id), isNull(testCycleTtls.revokedAt))).orderBy(desc(testCycles.createdAt));
    }),
    pendingReports: protectedProcedure.input(z.object({ testCycleId: uuid })).query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]);
      if (!(await isActiveCycleTtl(ctx.user.id, input.testCycleId))) fail("لست قائداً معيّناً لهذه الدورة.", "FORBIDDEN");
      const db = dbOrFail();
      const reports = await db.select().from(bugReports).where(and(eq(bugReports.testCycleId, input.testCycleId), eq(bugReports.status, "pending"))).orderBy(desc(bugReports.createdAt));
      const events = reports.length ? await db.select().from(bugReportEvents).where(inArray(bugReportEvents.bugReportId, reports.map(report => report.id))).orderBy(bugReportEvents.createdAt) : [];
      const attachments = reports.length ? await db.select({ id: bugAttachments.id, bugReportId: bugAttachments.bugReportId, originalName: bugAttachments.originalName, mimeType: bugAttachments.mimeType, sizeBytes: bugAttachments.sizeBytes }).from(bugAttachments).where(inArray(bugAttachments.bugReportId, reports.map(report => report.id))) : [];
      return projectReportsWithHistory(reports, events, attachments);
    }),
    cycleApplications: protectedProcedure.input(z.object({ testCycleId: uuid })).query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]);
      if (!(await isActiveCycleTtl(ctx.user.id, input.testCycleId))) fail("لست قائداً معيّناً لهذه الدورة.", "FORBIDDEN");
      return dbOrFail().select({ id: testCycleApplications.id, testerId: testCycleApplications.testerId, status: testCycleApplications.status, appliedAt: testCycleApplications.appliedAt, decisionReason: testCycleApplications.decisionReason, testerName: profiles.name, testerEmail: profiles.email, reputationScore: testerProfiles.reputationScore })
        .from(testCycleApplications).innerJoin(profiles, eq(profiles.id, testCycleApplications.testerId)).leftJoin(testerProfiles, eq(testerProfiles.userId, profiles.id))
        .where(eq(testCycleApplications.testCycleId, input.testCycleId)).orderBy(desc(testCycleApplications.appliedAt));
    }),
    reviewBug: protectedProcedure.input(z.discriminatedUnion("action", [z.object({ bugId: uuid, action: z.literal("accepted") }), z.object({ bugId: uuid, action: z.literal("rejected"), reason: z.string().min(12).max(2000) }), z.object({ bugId: uuid, action: z.literal("request_information"), reason: z.string().min(12).max(2000) })])).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]);
      const db = dbOrFail();
      const bug = await getBug(input.bugId);
      if (!(await isActiveCycleTtl(ctx.user.id, bug.testCycleId))) fail("لست قائد فريق الاختبار المعيّن لهذه الدورة.", "FORBIDDEN");
      if (bug.status !== "pending") fail("تم اتخاذ قرار نهائي في هذا التقرير.", "CONFLICT");
      await db.transaction(async tx => {
        const [current] = await tx.select().from(bugReports).where(eq(bugReports.id, bug.id)).limit(1);
        const [assignment] = await tx.select({ id: testCycleTtls.id }).from(testCycleTtls).where(and(eq(testCycleTtls.testCycleId, bug.testCycleId), eq(testCycleTtls.testerId, ctx.user.id), isNull(testCycleTtls.revokedAt))).limit(1);
        if (!current || !assignment || current.status !== "pending") fail("تعذر تنفيذ المراجعة لأن حالة التقرير تغيرت.", "CONFLICT");
        if (input.action === "request_information") {
          await tx.update(bugReports).set({ requestChangesReason: input.reason, reviewedBy: ctx.user.id, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(bugReports.id, bug.id));
          await tx.insert(bugReportEvents).values({ bugReportId: bug.id, actorId: ctx.user.id, type: "information_requested", message: input.reason });
          return;
        }
        if (input.action === "rejected") {
          await tx.update(bugReports).set({ status: "rejected", rejectionReason: input.reason, reviewedBy: ctx.user.id, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(bugReports.id, bug.id));
          await tx.insert(bugReportEvents).values({ bugReportId: bug.id, actorId: ctx.user.id, type: "rejected", message: input.reason });
          return;
        }
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${bug.testerId}))`);
        const [rate] = await tx.select().from(cycleBountyRates).where(and(eq(cycleBountyRates.testCycleId, bug.testCycleId), eq(cycleBountyRates.severity, bug.severity))).limit(1);
        const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, bug.testerId)).limit(1);
        if (!rate || !wallet) fail("تعذر التحقق من محفظة المختبر أو قيمة المكافأة.", "CONFLICT");
        const amount = Number(rate.bountyAmount);
        await tx.update(bugReports).set({ status: "accepted", reviewedBy: ctx.user.id, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(bugReports.id, bug.id));
        await tx.insert(bugReportEvents).values({ bugReportId: bug.id, actorId: ctx.user.id, type: "accepted" });
        await tx.update(wallets).set({ availableBalance: money(Number(wallet.availableBalance) + amount), updatedAt: new Date() }).where(eq(wallets.id, wallet.id));
        await tx.insert(transactions).values({ walletId: wallet.id, amount: money(amount), type: "bounty_released", referenceType: "bug_report", referenceId: bug.id, note: "مكافأة تقرير مقبول من قائد فريق الاختبار" });
        await tx.insert(reputationEvents).values({ testerId: bug.testerId, bugReportId: bug.id, points: 10, reason: "تقرير تم قبوله من قائد فريق الاختبار" });
        await tx.update(testerProfiles).set({ reputationScore: sql`${testerProfiles.reputationScore} + 10` }).where(eq(testerProfiles.userId, bug.testerId));
      });
      await notifyReportReviewerOutcome(bug.testerId, bug.id, bug.title, input.action === "request_information" ? "information_requested" : input.action, input.action === "accepted" ? undefined : input.reason);
      return { success: true, status: input.action === "request_information" ? "pending" as const : input.action };
    }),
    decideApplication: protectedProcedure.input(z.discriminatedUnion("decision", [z.object({ applicationId: uuid, decision: z.literal("accepted") }), z.object({ applicationId: uuid, decision: z.literal("rejected"), reason: z.string().min(12).max(2000) })])).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]);
      const db = dbOrFail();
      const [application] = await db.select().from(testCycleApplications).where(eq(testCycleApplications.id, input.applicationId)).limit(1);
      if (!application) fail("طلب الانضمام غير موجود.", "NOT_FOUND");
      await assertApplicationDecisionAuthority(db, ctx.user.id, ctx.user.role, application.testCycleId);
      if (application.status !== "pending") fail("تم اتخاذ قرار في هذا الطلب مسبقاً.", "CONFLICT");
      await db.update(testCycleApplications).set({ status: input.decision, decidedBy: ctx.user.id, decidedAt: new Date(), decisionReason: input.decision === "rejected" ? input.reason : null }).where(eq(testCycleApplications.id, application.id));
      await notify(application.testerId, input.decision === "accepted" ? "تم قبول طلب انضمامك" : "تم رفض طلب انضمامك", input.decision === "accepted" ? "أصبحت مؤهلاً لإرسال تقارير في دورة الاختبار." : `سبب الرفض: ${input.reason}`, "test_cycle_application", application.id);
      return { success: true };
    }),
  }),
  communityManager: router({
    eligibleTesters: protectedProcedure.query(async ({ ctx }) => {
      requireRole(ctx.user.role, ["community_manager"]);
      return dbOrFail().select({ id: profiles.id, name: profiles.name, email: profiles.email, reputationScore: testerProfiles.reputationScore })
        .from(profiles).innerJoin(testerProfiles, eq(testerProfiles.userId, profiles.id))
        .where(and(eq(profiles.role, "tester"), isNotNull(testerProfiles.completedAt))).orderBy(desc(testerProfiles.reputationScore));
    }),
    assignTtl: protectedProcedure.input(z.object({ testCycleId: uuid, testerId: uuid, assign: z.boolean() })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["community_manager"]);
      const db = dbOrFail();
      const [cycle] = await db.select({ id: testCycles.id }).from(testCycles).where(eq(testCycles.id, input.testCycleId)).limit(1);
      if (!cycle) fail("دورة الاختبار غير موجودة.", "NOT_FOUND");
      const [tester] = await db.select({ id: profiles.id }).from(profiles).innerJoin(testerProfiles, eq(testerProfiles.userId, profiles.id))
        .where(and(eq(profiles.id, input.testerId), eq(profiles.role, "tester"), isNotNull(testerProfiles.completedAt))).limit(1);
      if (!tester) fail("يمكن تعيين مختبر مكتمل الملف فقط قائداً لفريق الاختبار.", "NOT_FOUND");
      const [existing] = await db.select().from(testCycleTtls).where(and(eq(testCycleTtls.testCycleId, input.testCycleId), eq(testCycleTtls.testerId, input.testerId))).limit(1);
      if (input.assign) {
        if (existing) await db.update(testCycleTtls).set({ assignedBy: ctx.user.id, assignedAt: new Date(), revokedAt: null }).where(eq(testCycleTtls.id, existing.id));
        else await db.insert(testCycleTtls).values({ testCycleId: input.testCycleId, testerId: input.testerId, assignedBy: ctx.user.id });
      } else if (existing) {
        await db.update(testCycleTtls).set({ revokedAt: new Date() }).where(eq(testCycleTtls.id, existing.id));
      }
      return { success: true };
    }),
    cycleTtls: protectedProcedure.input(z.object({ testCycleId: uuid })).query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["community_manager"]);
      return dbOrFail().select({ id: testCycleTtls.id, testerId: testCycleTtls.testerId, assignedAt: testCycleTtls.assignedAt, testerName: profiles.name, testerEmail: profiles.email, reputationScore: testerProfiles.reputationScore })
        .from(testCycleTtls).innerJoin(profiles, eq(profiles.id, testCycleTtls.testerId)).leftJoin(testerProfiles, eq(testerProfiles.userId, profiles.id))
        .where(and(eq(testCycleTtls.testCycleId, input.testCycleId), isNull(testCycleTtls.revokedAt))).orderBy(desc(testCycleTtls.assignedAt));
    }),
    processPayout: protectedProcedure.input(z.object({ payoutId: uuid, decision: z.enum(["processed", "rejected"]), note: z.string().min(3).max(2000) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["community_manager"]);
      const db = dbOrFail();
      const [request] = await db.select().from(payoutRequests).where(eq(payoutRequests.id, input.payoutId)).limit(1);
      if (!request) fail("طلب السحب غير موجود.", "NOT_FOUND");
      if (request.status !== "pending") fail("تمت معالجة طلب السحب مسبقاً.", "CONFLICT");
      await db.transaction(async tx => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${request.testerId}))`);
        await tx.update(payoutRequests).set({ status: input.decision, processingNote: input.note, processedAt: new Date() }).where(and(eq(payoutRequests.id, request.id), eq(payoutRequests.status, "pending")));
        const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, request.testerId)).limit(1);
        if (!wallet) fail("محفظة المختبر غير متاحة.", "CONFLICT");
        if (input.decision === "processed") {
          await tx.insert(transactions).values({ walletId: wallet.id, amount: "0.00", type: "payout_sent", referenceType: "payout_request", referenceId: request.id, note: input.note });
        } else {
          await tx.update(wallets).set({ availableBalance: money(Number(wallet.availableBalance) + Number(request.amount)), updatedAt: new Date() }).where(eq(wallets.id, wallet.id));
          await tx.insert(transactions).values({ walletId: wallet.id, amount: money(Number(request.amount)), type: "payout_reversal", referenceType: "payout_request", referenceId: request.id, note: "استرداد طلب سحب مرفوض" });
        }
      });
      await notify(request.testerId, input.decision === "processed" ? "تم إرسال التحويل" : "تم رفض طلب السحب", input.note, "payout", request.id);
      return { success: true };
    }),
  }),
  roles: router({
    assignableUsers: protectedProcedure.query(async ({ ctx }) => {
      requireRole(ctx.user.role, ["admin"]);
      return dbOrFail().select({ id: profiles.id, name: profiles.name, email: profiles.email, role: profiles.role })
        .from(profiles).where(sql`${profiles.role} <> 'admin'`).orderBy(desc(profiles.createdAt)).limit(100);
    }),
    setCommunityManager: protectedProcedure.input(z.object({ targetUserId: uuid, enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin"]);
      const db = dbOrFail();
      const [target] = await db.select({ id: profiles.id, role: profiles.role }).from(profiles).where(eq(profiles.id, input.targetUserId)).limit(1);
      if (!target) fail("الحساب المطلوب غير موجود.", "NOT_FOUND");
      if (target.role === "admin") fail("لا يمكن تغيير دور مسؤول المنصة من هذه العملية.", "FORBIDDEN");
      await db.update(profiles).set({ role: input.enabled ? "community_manager" : "user", updatedAt: new Date() }).where(eq(profiles.id, target.id));
      return { success: true };
    }),
  }),
  admin: router({
    processPayout: protectedProcedure.input(z.object({ payoutId: uuid, decision: z.enum(["processed", "rejected"]), note: z.string().min(3).max(2000) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin"]);
      const db = dbOrFail();
      const [request] = await db.select().from(payoutRequests).where(eq(payoutRequests.id, input.payoutId)).limit(1);
      if (!request) fail("طلب السحب غير موجود.", "NOT_FOUND");
      if (request.status !== "pending") fail("تمت معالجة طلب السحب مسبقاً.");
      await db.transaction(async tx => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${request.testerId}))`);
        await tx.update(payoutRequests).set({ status: input.decision, processingNote: input.note, processedAt: new Date() }).where(eq(payoutRequests.id, request.id));
        if (input.decision === "rejected") {
          const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, request.testerId)).limit(1);
          if (!wallet) fail("محفظة المختبر غير متاحة.", "CONFLICT");
          await tx.update(wallets).set({ availableBalance: money(Number(wallet.availableBalance) + Number(request.amount)), updatedAt: new Date() }).where(eq(wallets.id, wallet.id));
          await tx.insert(transactions).values({ walletId: wallet.id, amount: money(Number(request.amount)), type: "payout_reversal", referenceType: "payout_request", referenceId: request.id, note: "استرداد طلب سحب مرفوض" });
        }
      });
      await notify(request.testerId, input.decision === "processed" ? "تمت معالجة طلب السحب" : "تم رفض طلب السحب", input.note, "payout", request.id);
      return { success: true };
    }),
  }),
  evidence: router({
    getSecureUrl: protectedProcedure.input(z.object({ attachmentId: uuid })).query(async ({ ctx, input }) => {
      const rows = await dbOrFail().select({ fileKey: bugAttachments.fileKey, originalName: bugAttachments.originalName, testerId: bugReports.testerId, clientId: projects.clientId, testCycleId: bugReports.testCycleId })
        .from(bugAttachments).innerJoin(bugReports, eq(bugReports.id, bugAttachments.bugReportId)).innerJoin(testCycles, eq(testCycles.id, bugReports.testCycleId)).innerJoin(projects, eq(projects.id, testCycles.projectId))
        .where(eq(bugAttachments.id, input.attachmentId)).limit(1);
      const attachment = rows[0];
      if (!attachment) fail("لم يتم العثور على الملف.", "NOT_FOUND");
      const ttl = ctx.user.role === "tester" && await isActiveCycleTtl(ctx.user.id, attachment.testCycleId);
      if (!(ctx.user.role === "admin" || attachment.testerId === ctx.user.id || attachment.clientId === ctx.user.id || ttl)) fail("ليس لديك صلاحية الوصول إلى هذا الملف.", "FORBIDDEN");
      return { url: await storageGetSignedUrl(attachment.fileKey), filename: attachment.originalName };
    }),
  }),
  notifications: router({
    list: protectedProcedure.query(({ ctx }) => dbOrFail().select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(30)),
    markRead: protectedProcedure.input(z.object({ id: uuid })).mutation(async ({ ctx, input }) => {
      await dbOrFail().update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
