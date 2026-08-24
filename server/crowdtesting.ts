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

export async function notify(userId: string, title: string, body: string, entityType?: string, entityId?: string) {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");
  await db.insert(notifications).values({ userId, type: entityType === "payout" ? "payout" : "bug_status", title, body, entityType, entityId });
}

export async function isActiveCycleTtl(userId: string, testCycleId: string) {
  const db = getDb();
  if (!db) return false;
  const [assignment] = await db.select({ id: testCycleTtls.id }).from(testCycleTtls)
    .where(and(eq(testCycleTtls.testerId, userId), eq(testCycleTtls.testCycleId, testCycleId), isNull(testCycleTtls.revokedAt))).limit(1);
  return Boolean(assignment);
}

export async function dashboardFor(role: string, userId: string) {
  const db = getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً.");

  if (role === "tester") {
    const [profile] = await db.select().from(testerProfiles).where(eq(testerProfiles.userId, userId)).limit(1);
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    const devices = await db.select().from(testerDevices).where(eq(testerDevices.testerId, userId));
    const now = new Date();
    const cycles = await db.select({ id: testCycles.id, title: testCycles.title, scopeDescription: testCycles.scopeDescription, buildUrl: testCycles.buildUrl, endAt: testCycles.endAt, projectName: projects.name })
      .from(testCycles).innerJoin(projects, eq(projects.id, testCycles.projectId))
      .where(and(eq(testCycles.status, "active"), lte(testCycles.startAt, now), gte(testCycles.endAt, now))).orderBy(desc(testCycles.endAt));
    const applications = await db.select({ testCycleId: testCycleApplications.testCycleId, status: testCycleApplications.status })
      .from(testCycleApplications).where(eq(testCycleApplications.testerId, userId));
    const invitations = await db.select({ testCycleId: testCycleInvitations.testCycleId, status: testCycleInvitations.status })
      .from(testCycleInvitations).where(eq(testCycleInvitations.testerId, userId));
    const applicationByCycle = new Map(applications.map(application => [application.testCycleId, application.status]));
    const invitationByCycle = new Map(invitations.map(invitation => [invitation.testCycleId, invitation.status]));
    const activeCycles = cycles.map(cycle => {
      const applicationStatus = applicationByCycle.get(cycle.id) ?? null;
      return {
        ...cycle,
        buildUrl: applicationStatus === "accepted" ? cycle.buildUrl : null,
        applicationStatus,
        invitationStatus: invitationByCycle.get(cycle.id) ?? null,
      };
    });
    const reports = await db.select().from(bugReports).where(eq(bugReports.testerId, userId)).orderBy(desc(bugReports.createdAt)).limit(30);
    return { kind: "tester" as const, profile, wallet, devices, activeCycles, reports };
  }

  if (role === "client") {
    const ownedProjects = await db.select().from(projects).where(eq(projects.clientId, userId)).orderBy(desc(projects.createdAt));
    const projectIds = ownedProjects.map(project => project.id);
    const cycles = projectIds.length ? await db.select().from(testCycles).where(inArray(testCycles.projectId, projectIds)).orderBy(desc(testCycles.createdAt)) : [];
    const cycleIds = cycles.map(cycle => cycle.id);
    const acceptedReports = cycleIds.length ? await db.select().from(bugReports).where(and(inArray(bugReports.testCycleId, cycleIds), eq(bugReports.status, "accepted"))).orderBy(desc(bugReports.createdAt)) : [];
    return { kind: "client" as const, projects: ownedProjects, cycles, acceptedReports };
  }

  if (role === "community_manager") {
    const cycles = await db.select({ id: testCycles.id, title: testCycles.title, status: testCycles.status, projectName: projects.name })
      .from(testCycles).innerJoin(projects, eq(projects.id, testCycles.projectId)).orderBy(desc(testCycles.createdAt));
    return { kind: "community_manager" as const, cycles };
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
