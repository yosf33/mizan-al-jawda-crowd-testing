import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { bugAttachments, bugReports, cycleBountyRates, notifications, payoutRequests, profiles, projects, reputationEvents, testerDevices, testerProfiles, testCycles, transactions, wallets } from "../drizzle/schema";
import { getDb } from "./db";
import { dashboardFor, isClientOwnerOfBug, money, notify } from "./crowdtesting";
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

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(() => ({ success: true } as const)),
  }),
  account: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      const [profile] = await dbOrFail().select().from(profiles).where(eq(profiles.id, ctx.user.id)).limit(1);
      return profile;
    }),
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
      requireRole(ctx.user.role, ["tester"]); const [device] = await dbOrFail().insert(testerDevices).values({ testerId: ctx.user.id, ...input }).returning({ id: testerDevices.id }); return { success: true, id: device.id };
    }),
    submitReport: protectedProcedure.input(z.object({ testCycleId: uuid, deviceId: uuid, title: z.string().min(5).max(240), category: z.enum(categoryValues), severity: z.enum(severityValues), stepsToReproduce: z.string().min(10).max(12000), expectedResult: z.string().min(5).max(6000), actualResult: z.string().min(5).max(6000), attachmentIds: z.array(uuid).max(12).default([]) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]); const db = dbOrFail();
      const [device] = await db.select().from(testerDevices).where(and(eq(testerDevices.id, input.deviceId), eq(testerDevices.testerId, ctx.user.id))).limit(1); if (!device) fail("الجهاز المحدد غير مسجل في حسابك.", "FORBIDDEN");
      const [cycle] = await db.select().from(testCycles).where(and(eq(testCycles.id, input.testCycleId), eq(testCycles.status, "active"))).limit(1); if (!cycle || cycle.endAt < new Date()) fail("دورة الاختبار غير متاحة حالياً.");
      const bugId = await db.transaction(async tx => { const { attachmentIds, ...report } = input; const [created] = await tx.insert(bugReports).values({ ...report, testerId: ctx.user.id }).returning({ id: bugReports.id }); if (attachmentIds.length) await tx.update(bugAttachments).set({ bugReportId: created.id }).where(and(inArray(bugAttachments.id, attachmentIds), eq(bugAttachments.uploadedBy, ctx.user.id), sql`${bugAttachments.bugReportId} is null`)); return created.id; });
      return { success: true, bugId, message: "تم إرسال تقرير الخطأ بنجاح." };
    }),
    uploadEvidence: protectedProcedure.input(z.object({ filename: z.string().min(1).max(180), mimeType: z.enum(["image/png", "image/jpeg", "video/mp4", "text/plain", "application/zip"]), base64: z.string().min(4).max(16_000_000) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]); const raw = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64"); if (!raw.length || raw.length > 10 * 1024 * 1024) fail("يجب ألا يتجاوز حجم الملف 10 ميغابايت.");
      const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_"); const key = `private/${ctx.user.id}/${crypto.randomUUID()}-${safeName}`; await storagePut(key, raw, input.mimeType);
      const [attachment] = await dbOrFail().insert(bugAttachments).values({ fileKey: key, originalName: input.filename, mimeType: input.mimeType, sizeBytes: raw.length, uploadedBy: ctx.user.id }).returning({ id: bugAttachments.id }); return { success: true, attachmentId: attachment.id, name: input.filename };
    }),
    requestPayout: protectedProcedure.input(z.object({ amount: z.number().positive().max(100000), method: z.enum(payoutMethods), paymentTargetInfo: z.string().min(4).max(300) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["tester"]); const db = dbOrFail(); const payoutId = await db.transaction(async tx => { await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ctx.user.id}))`); const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, ctx.user.id)).limit(1); if (!wallet || Number(wallet.availableBalance) < input.amount) fail("الرصيد المتاح لا يكفي لطلب التحويل."); const [request] = await tx.insert(payoutRequests).values({ testerId: ctx.user.id, amount: money(input.amount), method: input.method, paymentTargetInfo: input.paymentTargetInfo }).returning({ id: payoutRequests.id }); await tx.update(wallets).set({ availableBalance: money(Number(wallet.availableBalance) - input.amount), updatedAt: new Date() }).where(eq(wallets.id, wallet.id)); await tx.insert(transactions).values({ walletId: wallet.id, amount: money(-input.amount), type: "payout_debit", referenceType: "payout_request", referenceId: request.id, note: "طلب سحب قيد المعالجة" }); return request.id; }); return { success: true, payoutId };
    }),
  }),
  clientPortal: router({
    createProject: protectedProcedure.input(z.object({ name: z.string().min(3).max(180), description: z.string().min(20).max(8000) })).mutation(async ({ ctx, input }) => { requireRole(ctx.user.role, ["client"]); const [project] = await dbOrFail().insert(projects).values({ ...input, clientId: ctx.user.id }).returning({ id: projects.id }); return { success: true, projectId: project.id }; }),
    createCycle: protectedProcedure.input(z.object({ projectId: uuid, title: z.string().min(3).max(180), scopeDescription: z.string().min(20).max(10000), outOfScope: z.string().max(10000).optional(), buildUrl: z.string().url().max(2048), status: z.enum(["draft", "active"]).default("draft"), startAt: z.coerce.date(), endAt: z.coerce.date(), rates: z.object({ critical: z.number().positive(), major: z.number().positive(), minor: z.number().positive() }) })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["client"]); if (input.endAt <= input.startAt) fail("يجب أن يكون تاريخ الانتهاء بعد تاريخ البداية."); const db = dbOrFail(); const [project] = await db.select().from(projects).where(and(eq(projects.id, input.projectId), eq(projects.clientId, ctx.user.id))).limit(1); if (!project) fail("المشروع غير متاح في حسابك.", "FORBIDDEN"); const cycleId = await db.transaction(async tx => { const [cycle] = await tx.insert(testCycles).values({ projectId: input.projectId, title: input.title, scopeDescription: input.scopeDescription, outOfScope: input.outOfScope ?? null, buildUrl: input.buildUrl, status: input.status, startAt: input.startAt, endAt: input.endAt }).returning({ id: testCycles.id }); await tx.insert(cycleBountyRates).values([{ testCycleId: cycle.id, severity: "critical", bountyAmount: money(input.rates.critical) }, { testCycleId: cycle.id, severity: "major", bountyAmount: money(input.rates.major) }, { testCycleId: cycle.id, severity: "minor", bountyAmount: money(input.rates.minor) }]); return cycle.id; }); return { success: true, cycleId };
    }),
    decideBug: protectedProcedure.input(z.discriminatedUnion("decision", [z.object({ bugId: uuid, decision: z.literal("approve") }), z.object({ bugId: uuid, decision: z.literal("reject"), rejectionReason: z.string().min(12).max(2000) })])).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["client"]); if (!(await isClientOwnerOfBug(ctx.user.id, input.bugId))) fail("لا يمكنك اتخاذ قرار بشأن تقرير لا يخص مشروعك.", "FORBIDDEN"); const db = dbOrFail(); const testerId = await db.transaction(async tx => { const [bug] = await tx.select().from(bugReports).where(eq(bugReports.id, input.bugId)).limit(1); if (!bug || bug.status !== "triaged") fail("لا يمكن للعميل اتخاذ قرار قبل إتمام الفرز."); await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${bug.testerId}))`); const [rate] = await tx.select().from(cycleBountyRates).where(and(eq(cycleBountyRates.testCycleId, bug.testCycleId), eq(cycleBountyRates.severity, bug.severity))).limit(1); const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, bug.testerId)).limit(1); if (!rate || !wallet) fail("تعذر تحديد مكافأة هذا التقرير.", "CONFLICT"); const amount = Number(rate.bountyAmount); if (input.decision === "approve") { await tx.update(bugReports).set({ status: "approved", clientDecidedAt: new Date(), updatedAt: new Date() }).where(eq(bugReports.id, bug.id)); await tx.update(wallets).set({ pendingBalance: money(Math.max(0, Number(wallet.pendingBalance) - amount)), availableBalance: money(Number(wallet.availableBalance) + amount), updatedAt: new Date() }).where(eq(wallets.id, wallet.id)); await tx.insert(transactions).values({ walletId: wallet.id, amount: money(amount), type: "bounty_released", referenceType: "bug_report", referenceId: bug.id, note: "مكافأة تقرير معتمد" }); await tx.insert(reputationEvents).values({ testerId: bug.testerId, bugReportId: bug.id, points: 10, reason: "تقرير تم اعتماده من العميل" }); await tx.update(testerProfiles).set({ reputationScore: sql`${testerProfiles.reputationScore} + 10` }).where(eq(testerProfiles.userId, bug.testerId)); } else { await tx.update(bugReports).set({ status: "rejected", rejectionReason: input.rejectionReason, clientDecidedAt: new Date(), updatedAt: new Date() }).where(eq(bugReports.id, bug.id)); await tx.update(wallets).set({ pendingBalance: money(Math.max(0, Number(wallet.pendingBalance) - amount)), updatedAt: new Date() }).where(eq(wallets.id, wallet.id)); await tx.insert(reputationEvents).values({ testerId: bug.testerId, bugReportId: bug.id, points: -5, reason: "تم رفض التقرير من العميل" }); await tx.update(testerProfiles).set({ reputationScore: sql`${testerProfiles.reputationScore} - 5` }).where(eq(testerProfiles.userId, bug.testerId)); } return bug.testerId; }); await notify(testerId, input.decision === "approve" ? "تم اعتماد تقريرك" : "تم رفض تقريرك", input.decision === "approve" ? "أضاف العميل مكافأتك إلى رصيدك المتاح." : `سبب الرفض: ${input.rejectionReason}`, "bug_report", input.bugId); return { success: true };
    }),
  }),
  admin: router({
    triageBug: protectedProcedure.input(z.discriminatedUnion("action", [z.object({ bugId: uuid, action: z.literal("approve") }), z.object({ bugId: uuid, action: z.literal("request_changes"), reason: z.string().min(12).max(2000) }), z.object({ bugId: uuid, action: z.literal("mark_duplicate"), duplicateOfId: uuid, reason: z.string().min(12).max(2000) })])).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin"]); const db = dbOrFail(); const bug = await getBug(input.bugId); if (!["submitted", "under_review", "request_changes"].includes(bug.status)) fail("تم اتخاذ إجراء سابقاً على هذا التقرير."); if (input.action === "mark_duplicate") { if (input.duplicateOfId === bug.id) fail("لا يمكن أن يكون التقرير مكرراً من نفسه."); const [original] = await db.select().from(bugReports).where(eq(bugReports.id, input.duplicateOfId)).limit(1); if (!original || original.testCycleId !== bug.testCycleId) fail("يجب أن يشير التكرار إلى تقرير من دورة الاختبار نفسها."); await db.update(bugReports).set({ status: "duplicate", duplicateOfId: input.duplicateOfId, duplicateReason: input.reason, triagedBy: ctx.user.id, triagedAt: new Date(), updatedAt: new Date() }).where(eq(bugReports.id, bug.id)); await notify(bug.testerId, "تم وسم التقرير كمكرر", `السبب: ${input.reason}`, "bug_report", bug.id); return { success: true, status: "duplicate" as const }; } if (input.action === "request_changes") { await db.update(bugReports).set({ status: "request_changes", requestChangesReason: input.reason, triagedBy: ctx.user.id, triagedAt: new Date(), updatedAt: new Date() }).where(eq(bugReports.id, bug.id)); await notify(bug.testerId, "مطلوب تحديث تقرير الخطأ", input.reason, "bug_report", bug.id); return { success: true, status: "request_changes" as const }; } await db.transaction(async tx => { await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${bug.testerId}))`); const [rate] = await tx.select().from(cycleBountyRates).where(and(eq(cycleBountyRates.testCycleId, bug.testCycleId), eq(cycleBountyRates.severity, bug.severity))).limit(1); const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, bug.testerId)).limit(1); if (!rate || !wallet) fail("تعذر التحقق من محفظة المختبر أو قيمة المكافأة.", "CONFLICT"); const amount = Number(rate.bountyAmount); await tx.update(bugReports).set({ status: "triaged", triagedBy: ctx.user.id, triagedAt: new Date(), updatedAt: new Date() }).where(eq(bugReports.id, bug.id)); await tx.update(wallets).set({ pendingBalance: money(Number(wallet.pendingBalance) + amount), updatedAt: new Date() }).where(eq(wallets.id, wallet.id)); await tx.insert(transactions).values({ walletId: wallet.id, amount: money(amount), type: "bounty_pending", referenceType: "bug_report", referenceId: bug.id, note: "مكافأة بانتظار قرار العميل" }); }); await notify(bug.testerId, "اجتاز تقريرك مرحلة الفرز", "أصبح التقرير بانتظار قرار العميل، وأضيفت المكافأة إلى رصيدك المعلق.", "bug_report", bug.id); return { success: true, status: "triaged" as const };
    }),
    processPayout: protectedProcedure.input(z.object({ payoutId: uuid, decision: z.enum(["processed", "rejected"]), note: z.string().min(3).max(2000) })).mutation(async ({ ctx, input }) => { requireRole(ctx.user.role, ["admin"]); const db = dbOrFail(); const [request] = await db.select().from(payoutRequests).where(eq(payoutRequests.id, input.payoutId)).limit(1); if (!request) fail("طلب السحب غير موجود.", "NOT_FOUND"); if (request.status !== "pending") fail("تمت معالجة طلب السحب مسبقاً."); await db.transaction(async tx => { await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${request.testerId}))`); await tx.update(payoutRequests).set({ status: input.decision, processingNote: input.note, processedAt: new Date() }).where(eq(payoutRequests.id, request.id)); if (input.decision === "rejected") { const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, request.testerId)).limit(1); if (!wallet) fail("محفظة المختبر غير متاحة.", "CONFLICT"); await tx.update(wallets).set({ availableBalance: money(Number(wallet.availableBalance) + Number(request.amount)), updatedAt: new Date() }).where(eq(wallets.id, wallet.id)); await tx.insert(transactions).values({ walletId: wallet.id, amount: money(Number(request.amount)), type: "payout_reversal", referenceType: "payout_request", referenceId: request.id, note: "استرداد طلب سحب مرفوض" }); } }); await notify(request.testerId, input.decision === "processed" ? "تمت معالجة طلب السحب" : "تم رفض طلب السحب", input.note, "payout", request.id); return { success: true }; }),
  }),
  evidence: router({ getSecureUrl: protectedProcedure.input(z.object({ attachmentId: uuid })).query(async ({ ctx, input }) => { const rows = await dbOrFail().select({ fileKey: bugAttachments.fileKey, originalName: bugAttachments.originalName, testerId: bugReports.testerId, clientId: projects.clientId }).from(bugAttachments).innerJoin(bugReports, eq(bugReports.id, bugAttachments.bugReportId)).innerJoin(testCycles, eq(testCycles.id, bugReports.testCycleId)).innerJoin(projects, eq(projects.id, testCycles.projectId)).where(eq(bugAttachments.id, input.attachmentId)).limit(1); const attachment = rows[0]; if (!attachment) fail("لم يتم العثور على الملف.", "NOT_FOUND"); if (!(ctx.user.role === "admin" || attachment.testerId === ctx.user.id || attachment.clientId === ctx.user.id)) fail("ليس لديك صلاحية الوصول إلى هذا الملف.", "FORBIDDEN"); return { url: await storageGetSignedUrl(attachment.fileKey), filename: attachment.originalName }; }) }),
  notifications: router({ list: protectedProcedure.query(({ ctx }) => dbOrFail().select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(30)), markRead: protectedProcedure.input(z.object({ id: uuid })).mutation(async ({ ctx, input }) => { await dbOrFail().update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id))); return { success: true }; }) }),
});

export type AppRouter = typeof appRouter;
