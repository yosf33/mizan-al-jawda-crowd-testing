import {
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const userRoles = ["user", "tester", "client", "admin"] as const;
export const bugCategories = ["functional", "ui", "performance", "crash"] as const;
export const severityLevels = ["critical", "major", "minor"] as const;
export const bugStatuses = [
  "submitted",
  "under_review",
  "request_changes",
  "triaged",
  "approved",
  "rejected",
  "duplicate",
] as const;

/** Core account created by Manus OAuth. Product roles are assigned during onboarding. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", userRoles).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const testerProfiles = mysqlTable(
  "tester_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    country: varchar("country", { length: 80 }),
    phoneNumber: varchar("phoneNumber", { length: 32 }),
    payoutMethod: mysqlEnum("payoutMethod", ["instapay", "vodafone_cash", "paypal", "bank_transfer"]),
    payoutDetails: text("payoutDetails"),
    reputationScore: int("reputationScore").default(0).notNull(),
    completedAt: timestamp("completedAt"),
  },
  table => [index("tester_profile_user_idx").on(table.userId)],
);

export const testerDevices = mysqlTable(
  "tester_devices",
  {
    id: int("id").autoincrement().primaryKey(),
    testerId: int("testerId").notNull(),
    deviceType: mysqlEnum("deviceType", ["mobile", "desktop", "tablet"]).notNull(),
    brandModel: varchar("brandModel", { length: 180 }).notNull(),
    osName: mysqlEnum("osName", ["android", "ios", "windows", "macos", "linux"]).notNull(),
    osVersion: varchar("osVersion", { length: 60 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("device_tester_idx").on(table.testerId)],
);

export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId").notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("project_client_idx").on(table.clientId)],
);

export const testCycles = mysqlTable(
  "test_cycles",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    scopeDescription: text("scopeDescription").notNull(),
    outOfScope: text("outOfScope"),
    buildUrl: varchar("buildUrl", { length: 2048 }).notNull(),
    status: mysqlEnum("status", ["draft", "active", "in_review", "completed"]).default("draft").notNull(),
    startAt: timestamp("startAt").notNull(),
    endAt: timestamp("endAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("cycle_project_idx").on(table.projectId), index("cycle_status_idx").on(table.status)],
);

export const cycleBountyRates = mysqlTable(
  "cycle_bounty_rates",
  {
    id: int("id").autoincrement().primaryKey(),
    testCycleId: int("testCycleId").notNull(),
    severity: mysqlEnum("severity", severityLevels).notNull(),
    bountyAmount: decimal("bountyAmount", { precision: 12, scale: 2 }).notNull(),
  },
  table => [uniqueIndex("cycle_severity_unique").on(table.testCycleId, table.severity)],
);

export const bugReports = mysqlTable(
  "bug_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    testCycleId: int("testCycleId").notNull(),
    testerId: int("testerId").notNull(),
    deviceId: int("deviceId").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    category: mysqlEnum("category", bugCategories).notNull(),
    severity: mysqlEnum("severity", severityLevels).notNull(),
    stepsToReproduce: text("stepsToReproduce").notNull(),
    expectedResult: text("expectedResult").notNull(),
    actualResult: text("actualResult").notNull(),
    status: mysqlEnum("status", bugStatuses).default("submitted").notNull(),
    duplicateOfId: int("duplicateOfId"),
    duplicateReason: text("duplicateReason"),
    rejectionReason: text("rejectionReason"),
    requestChangesReason: text("requestChangesReason"),
    triagedBy: int("triagedBy"),
    triagedAt: timestamp("triagedAt"),
    clientDecidedAt: timestamp("clientDecidedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("bug_tester_idx").on(table.testerId),
    index("bug_cycle_idx").on(table.testCycleId),
    index("bug_status_idx").on(table.status),
  ],
);

export const bugAttachments = mysqlTable(
  "bug_attachments",
  {
    id: int("id").autoincrement().primaryKey(),
    bugReportId: int("bugReportId").notNull(),
    fileKey: varchar("fileKey", { length: 512 }).notNull().unique(),
    originalName: varchar("originalName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 120 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    uploadedBy: int("uploadedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("attachment_bug_idx").on(table.bugReportId)],
);

export const wallets = mysqlTable(
  "wallets",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    availableBalance: decimal("availableBalance", { precision: 12, scale: 2 }).default("0.00").notNull(),
    pendingBalance: decimal("pendingBalance", { precision: 12, scale: 2 }).default("0.00").notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("wallet_user_idx").on(table.userId)],
);

export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    walletId: int("walletId").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    type: mysqlEnum("type", ["bounty_pending", "bounty_released", "payout_debit", "payout_reversal"]).notNull(),
    referenceType: varchar("referenceType", { length: 60 }).notNull(),
    referenceId: int("referenceId").notNull(),
    note: varchar("note", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("transaction_wallet_idx").on(table.walletId)],
);

export const payoutRequests = mysqlTable(
  "payout_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    testerId: int("testerId").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    method: mysqlEnum("method", ["instapay", "vodafone_cash", "paypal", "bank_transfer"]).notNull(),
    paymentTargetInfo: varchar("paymentTargetInfo", { length: 300 }).notNull(),
    status: mysqlEnum("status", ["pending", "processed", "rejected"]).default("pending").notNull(),
    processingNote: text("processingNote"),
    requestedAt: timestamp("requestedAt").defaultNow().notNull(),
    processedAt: timestamp("processedAt"),
  },
  table => [index("payout_tester_idx").on(table.testerId), index("payout_status_idx").on(table.status)],
);

export const reputationEvents = mysqlTable(
  "reputation_events",
  {
    id: int("id").autoincrement().primaryKey(),
    testerId: int("testerId").notNull(),
    bugReportId: int("bugReportId"),
    points: int("points").notNull(),
    reason: varchar("reason", { length: 180 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("reputation_tester_idx").on(table.testerId)],
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", ["bug_status", "payout", "system"]).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    body: text("body").notNull(),
    entityType: varchar("entityType", { length: 60 }),
    entityId: int("entityId"),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notification_user_idx").on(table.userId, table.readAt)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
