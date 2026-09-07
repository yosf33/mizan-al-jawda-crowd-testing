import { and, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  bugAttachments,
  bugReports,
  cycleBountyRates,
  notifications,
  payoutRequests,
  profiles,
  reputationEvents,
  projects,
  testCycleApplications,
  testCycleInvitations,
  testCycleTtls,
  testerDevices,
  testerProfiles,
  testCycles,
  transactions,
  wallets,
  bugReportEvents,
} from "../drizzle/schema";

export type AppRole = "tester" | "client" | "community_manager" | "admin";

export function assertRole(role: string, allowed: AppRole[]) {
  if (!allowed.includes(role as AppRole)) throw new Error("ليس لديك صلاحية للوصول إلى هذه العملية.");
}

export function money(value: string | number) {
  return Number(value).toFixed(2);
}

export function isMissingV3SchemaError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "42P01");
}

export async function readV3OrFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isMissingV3SchemaError(error)) return fallback;
    throw error;
  }
}

export function projectReportsWithHistory<T extends { id: string }, E extends { bugReportId: string }, A extends { bugReportId: string | null }>(reports: T[], events: E[], attachments: A[] = []) {
  const eventsByReport = new Map<string, E[]>();
  const attachmentsByReport = new Map<string, A[]>();
  for (const event of events) {
    const history = eventsByReport.get(event.bugReportId) ?? [];
    history.push(event);
    eventsByReport.set(event.bugReportId, history);
  }
  for (const attachment of attachments) {
    if (!attachment.bugReportId) continue;
    const reportAttachments = attachmentsByReport.get(attachment.bugReportId) ?? [];
    reportAttachments.push(attachment);
    attachmentsByReport.set(attachment.bugReportId, reportAttachments);
  }
  return reports.map(report => ({ ...report, statusHistory: eventsByReport.get(report.id) ?? [], attachments: attachmentsByReport.get(report.id) ?? [] }));
}

export async function notify(userId: string, title: string, body: string, entityType?: string, entityId?: string) {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");
  await db.insert(notifications).values({ userId, type: entityType === "payout" ? "payout" : "bug_status", title, body, entityType, entityId });
}

export async function isActiveCycleTtl(userId: string, testCycleId: string) {
  const db = getDb();
  if (!db) return false;
  const [assignment] = await readV3OrFallback(() => db.select({ id: testCycleTtls.id }).from(testCycleTtls)
    .where(and(eq(testCycleTtls.testerId, userId), eq(testCycleTtls.testCycleId, testCycleId), isNull(testCycleTtls.revokedAt))).limit(1), [] as { id: string }[]);
  return Boolean(assignment);
}

export async function testerOverviewData(userId: string) {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");
  const now = new Date();

  const [profileRows, walletRows, cycles, applications, invitations, reportCountRows] = await Promise.all([
    db.select().from(testerProfiles).where(eq(testerProfiles.userId, userId)).limit(1),
    db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1),
    db.select({ id: testCycles.id, title: testCycles.title, scopeDescription: testCycles.scopeDescription, buildUrl: testCycles.buildUrl, endAt: testCycles.endAt, projectName: projects.name })
      .from(testCycles).innerJoin(projects, eq(projects.id, testCycles.projectId))
      .where(and(eq(testCycles.status, "active"), lte(testCycles.startAt, now), gte(testCycles.endAt, now))).orderBy(desc(testCycles.endAt)),
    readV3OrFallback(() => db.select({ testCycleId: testCycleApplications.testCycleId, status: testCycleApplications.status })
      .from(testCycleApplications).where(eq(testCycleApplications.testerId, userId)), [] as { testCycleId: string; status: "pending" | "accepted" | "rejected" }[]),
    readV3OrFallback(() => db.select({ testCycleId: testCycleInvitations.testCycleId, status: testCycleInvitations.status })
      .from(testCycleInvitations).where(eq(testCycleInvitations.testerId, userId)), [] as { testCycleId: string; status: "pending" | "applied" | "expired" }[]),
    db.select({ count: sql<number>`count(*)::int` }).from(bugReports).where(eq(bugReports.testerId, userId)),
  ]);

  const applicationByCycle = new Map(applications.map(a => [a.testCycleId, a.status]));
  const invitationByCycle = new Map(invitations.map(i => [i.testCycleId, i.status]));
  const activeCycles = cycles.map(cycle => {
    const applicationStatus = applicationByCycle.get(cycle.id) ?? null;
    return { ...cycle, buildUrl: applicationStatus === "accepted" ? cycle.buildUrl : null, applicationStatus, invitationStatus: invitationByCycle.get(cycle.id) ?? null };
  });

  return {
    kind: "tester" as const,
    profile: profileRows[0] ?? null,
    wallet: walletRows[0] ?? null,
    activeCycles,
    reportsCount: reportCountRows[0]?.count ?? 0,
  };
}

export async function testerReportsData(userId: string) {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");
  const reports = await db.select().from(bugReports).where(eq(bugReports.testerId, userId)).orderBy(desc(bugReports.createdAt)).limit(30);
  if (!reports.length) return [];
  const [reportEvents, attachments] = await Promise.all([
    readV3OrFallback(() => db.select().from(bugReportEvents).where(inArray(bugReportEvents.bugReportId, reports.map(r => r.id))).orderBy(bugReportEvents.createdAt), []),
    db.select({ id: bugAttachments.id, bugReportId: bugAttachments.bugReportId, originalName: bugAttachments.originalName, mimeType: bugAttachments.mimeType, sizeBytes: bugAttachments.sizeBytes }).from(bugAttachments).where(inArray(bugAttachments.bugReportId, reports.map(r => r.id))).orderBy(desc(bugAttachments.createdAt)),
  ]);
  return projectReportsWithHistory(reports, reportEvents, attachments);
}

export async function testerWalletData(userId: string) {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  const [payoutHistory, transactionsHistory] = await Promise.all([
    db.select().from(payoutRequests).where(eq(payoutRequests.testerId, userId)).orderBy(desc(payoutRequests.requestedAt)).limit(30),
    wallet ? db.select().from(transactions).where(eq(transactions.walletId, wallet.id)).orderBy(desc(transactions.createdAt)).limit(50) : Promise.resolve([]),
  ]);
  return { availableBalance: Number(wallet?.availableBalance || 0), payoutHistory, transactionsHistory };
}

export async function testerDevicesData(userId: string) {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");
  return db.select().from(testerDevices).where(eq(testerDevices.testerId, userId));
}

export async function dashboardFor(role: string, userId: string) {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");

  if (role === "tester") {
    const [overview, reports, walletData, devices] = await Promise.all([
      testerOverviewData(userId),
      testerReportsData(userId),
      testerWalletData(userId),
      testerDevicesData(userId),
    ]);
    return {
      kind: "tester" as const,
      profile: overview.profile,
      wallet: overview.wallet,
      devices,
      activeCycles: overview.activeCycles,
      reports,
      payoutHistory: walletData.payoutHistory,
      transactionsHistory: walletData.transactionsHistory,
    };
  }

  if (role === "client") {
    const ownedProjects = await db.select().from(projects).where(eq(projects.clientId, userId)).orderBy(desc(projects.createdAt));
    const projectIds = ownedProjects.map(project => project.id);
    const cycles = projectIds.length ? await db.select().from(testCycles).where(inArray(testCycles.projectId, projectIds)).orderBy(desc(testCycles.createdAt)) : [];
    const cycleIds = cycles.map(cycle => cycle.id);
    const acceptedReports = cycleIds.length ? await db.select().from(bugReports).where(and(inArray(bugReports.testCycleId, cycleIds), eq(bugReports.status, "accepted"))).orderBy(desc(bugReports.createdAt)) : [];
    const reportEvents = acceptedReports.length ? await db.select().from(bugReportEvents).where(inArray(bugReportEvents.bugReportId, acceptedReports.map(report => report.id))).orderBy(bugReportEvents.createdAt) : [];
    const attachments = acceptedReports.length ? await db.select({ id: bugAttachments.id, bugReportId: bugAttachments.bugReportId, originalName: bugAttachments.originalName, mimeType: bugAttachments.mimeType, sizeBytes: bugAttachments.sizeBytes }).from(bugAttachments).where(inArray(bugAttachments.bugReportId, acceptedReports.map(report => report.id))).orderBy(desc(bugAttachments.createdAt)) : [];
    return { kind: "client" as const, projects: ownedProjects, cycles, acceptedReports: projectReportsWithHistory(acceptedReports, reportEvents, attachments) };
  }

  if (role === "community_manager") {
    const cycles = await db.select({ id: testCycles.id, title: testCycles.title, status: testCycles.status, projectName: projects.name })
      .from(testCycles).innerJoin(projects, eq(projects.id, testCycles.projectId)).orderBy(desc(testCycles.createdAt));
    const pendingPayouts = await db.select({ id: payoutRequests.id, testerId: payoutRequests.testerId, testerName: profiles.name, testerEmail: profiles.email, amount: payoutRequests.amount, method: payoutRequests.method, paymentTargetInfo: payoutRequests.paymentTargetInfo, status: payoutRequests.status, processingNote: payoutRequests.processingNote, requestedAt: payoutRequests.requestedAt, processedAt: payoutRequests.processedAt })
      .from(payoutRequests).innerJoin(profiles, eq(profiles.id, payoutRequests.testerId)).where(eq(payoutRequests.status, "pending")).orderBy(desc(payoutRequests.requestedAt));
    const transactionsHistory = await db.select({ id: transactions.id, amount: transactions.amount, type: transactions.type, referenceType: transactions.referenceType, referenceId: transactions.referenceId, note: transactions.note, createdAt: transactions.createdAt, testerId: profiles.id, testerName: profiles.name, testerEmail: profiles.email })
      .from(transactions).innerJoin(wallets, eq(wallets.id, transactions.walletId)).innerJoin(profiles, eq(profiles.id, wallets.userId)).orderBy(desc(transactions.createdAt)).limit(100);
    return { kind: "community_manager" as const, cycles, pendingPayouts, transactionsHistory };
  }

  if (role === "admin") {
    const pendingPayouts = await db.select().from(payoutRequests).where(eq(payoutRequests.status, "pending")).orderBy(desc(payoutRequests.requestedAt));
    const communityManagers = await db.select({ id: profiles.id, name: profiles.name, email: profiles.email }).from(profiles).where(eq(profiles.role, "community_manager"));
    return { kind: "admin" as const, pendingPayouts, communityManagers };
  }

  return { kind: "user" as const };
}

export const schemaTables = {
  profiles, testerProfiles, testerDevices, projects, testCycles, cycleBountyRates, testCycleApplications, testCycleInvitations,
  testCycleTtls, bugReports, bugReportEvents, bugAttachments, wallets, transactions, payoutRequests, reputationEvents, notifications,
};
