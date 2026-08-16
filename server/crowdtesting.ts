import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  bugAttachments,
  bugReports,
  cycleBountyRates,
  notifications,
  payoutRequests,
  projects,
  reputationEvents,
  testerDevices,
  testerProfiles,
  testCycles,
  transactions,
  users,
  wallets,
} from "../drizzle/schema";

export type AppRole = "tester" | "client" | "admin";

export function assertRole(role: string, allowed: AppRole[]) {
  if (!allowed.includes(role as AppRole)) {
    throw new Error("ليس لديك صلاحية للوصول إلى هذه العملية.");
  }
}

export function money(value: string | number) {
  return Number(value).toFixed(2);
}

export async function notify(userId: number, title: string, body: string, entityType?: string, entityId?: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");
  await db.insert(notifications).values({ userId, type: entityType === "payout" ? "payout" : "bug_status", title, body, entityType, entityId });
}

export async function isClientOwnerOfBug(clientId: number, bugId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: bugReports.id })
    .from(bugReports)
    .innerJoin(testCycles, eq(testCycles.id, bugReports.testCycleId))
    .innerJoin(projects, eq(projects.id, testCycles.projectId))
    .where(and(eq(bugReports.id, bugId), eq(projects.clientId, clientId)))
    .limit(1);
  return rows.length > 0;
}

export async function dashboardFor(role: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");

  if (role === "tester") {
    const [profile] = await db.select().from(testerProfiles).where(eq(testerProfiles.userId, userId)).limit(1);
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    const devices = await db.select().from(testerDevices).where(eq(testerDevices.testerId, userId));
    const activeCycles = await db
      .select({ id: testCycles.id, title: testCycles.title, scopeDescription: testCycles.scopeDescription, buildUrl: testCycles.buildUrl, endAt: testCycles.endAt, projectName: projects.name })
      .from(testCycles)
      .innerJoin(projects, eq(projects.id, testCycles.projectId))
      .where(and(eq(testCycles.status, "active"), gte(testCycles.endAt, new Date())))
      .orderBy(desc(testCycles.endAt));
    const reports = await db.select().from(bugReports).where(eq(bugReports.testerId, userId)).orderBy(desc(bugReports.createdAt)).limit(10);
    return { kind: "tester", profile, wallet, devices, activeCycles, reports };
  }

  if (role === "client") {
    const ownedProjects = await db.select().from(projects).where(eq(projects.clientId, userId)).orderBy(desc(projects.createdAt));
    const ids = ownedProjects.map(project => project.id);
    const cycles = ids.length ? await db.select().from(testCycles).where(inArray(testCycles.projectId, ids)).orderBy(desc(testCycles.createdAt)) : [];
    const cycleIds = cycles.map(cycle => cycle.id);
    const triagedReports = cycleIds.length ? await db.select().from(bugReports).where(and(inArray(bugReports.testCycleId, cycleIds), eq(bugReports.status, "triaged"))).orderBy(desc(bugReports.createdAt)) : [];
    return { kind: "client", projects: ownedProjects, cycles, triagedReports };
  }

  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(bugReports).where(inArray(bugReports.status, ["submitted", "under_review", "request_changes"]));
  const pendingReports = await db.select().from(bugReports).where(inArray(bugReports.status, ["submitted", "under_review", "request_changes"])).orderBy(desc(bugReports.createdAt)).limit(25);
  const pendingPayouts = await db.select().from(payoutRequests).where(eq(payoutRequests.status, "pending")).orderBy(desc(payoutRequests.requestedAt));
  return { kind: "admin", pendingCount: Number(pendingCount?.count ?? 0), pendingReports, pendingPayouts };
}

export const schemaTables = {
  users,
  testerProfiles,
  testerDevices,
  projects,
  testCycles,
  cycleBountyRates,
  bugReports,
  bugAttachments,
  wallets,
  transactions,
  payoutRequests,
  reputationEvents,
  notifications,
};
