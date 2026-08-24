import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "tester", "client", "community_manager", "admin"]);
export const payoutMethod = pgEnum("payout_method", ["instapay", "vodafone_cash", "paypal", "bank_transfer"]);
export const deviceKind = pgEnum("device_kind", ["mobile", "desktop", "tablet"]);
export const operatingSystem = pgEnum("operating_system", ["android", "ios", "windows", "macos", "linux"]);
export const cycleStatus = pgEnum("cycle_status", ["draft", "active", "in_review", "completed"]);
export const bugCategory = pgEnum("bug_category", ["functional", "ui", "performance", "crash"]);
export const severityLevel = pgEnum("severity_level", ["critical", "major", "minor"]);
export const bugStatus = pgEnum("bug_status", ["pending", "accepted", "rejected"]);
export const applicationStatus = pgEnum("application_status", ["pending", "accepted", "rejected"]);
export const invitationStatus = pgEnum("invitation_status", ["pending", "applied", "expired"]);
export const reportEventType = pgEnum("report_event_type", ["submitted", "information_requested", "accepted", "rejected"]);
export const transactionType = pgEnum("transaction_type", ["bounty_pending", "bounty_released", "payout_debit", "payout_reversal", "payout_sent"]);
export const payoutStatus = pgEnum("payout_status", ["pending", "processed", "rejected"]);
export const notificationType = pgEnum("notification_type", ["bug_status", "payout", "system"]);

const createdAt = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

/** Application profile keyed directly to Supabase Auth's auth.users UUID. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: userRole("role").default("user").notNull(),
  createdAt,
  updatedAt,
});

export const testerProfiles = pgTable("tester_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  country: varchar("country", { length: 80 }),
  phoneNumber: varchar("phone_number", { length: 32 }),
  payoutMethod: payoutMethod("payout_method"),
  payoutDetails: text("payout_details"),
  reputationScore: integer("reputation_score").default(0).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, table => [index("tester_profile_user_idx").on(table.userId)]);

export const testerDevices = pgTable("tester_devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  testerId: uuid("tester_id").notNull(),
  deviceType: deviceKind("device_type").notNull(),
  brandModel: varchar("brand_model", { length: 180 }).notNull(),
  osName: operatingSystem("os_name").notNull(),
  osVersion: varchar("os_version", { length: 60 }).notNull(),
  createdAt,
}, table => [index("device_tester_idx").on(table.testerId)]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description").notNull(),
  createdAt,
  updatedAt,
}, table => [index("project_client_idx").on(table.clientId)]);

export const testCycles = pgTable("test_cycles", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  scopeDescription: text("scope_description").notNull(),
  outOfScope: text("out_of_scope"),
  buildUrl: varchar("build_url", { length: 2048 }).notNull(),
  status: cycleStatus("status").default("draft").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  createdAt,
}, table => [index("cycle_project_idx").on(table.projectId), index("cycle_status_idx").on(table.status)]);

export const cycleBountyRates = pgTable("cycle_bounty_rates", {
  id: uuid("id").defaultRandom().primaryKey(),
  testCycleId: uuid("test_cycle_id").notNull(),
  severity: severityLevel("severity").notNull(),
  bountyAmount: numeric("bounty_amount", { precision: 12, scale: 2 }).notNull(),
}, table => [uniqueIndex("cycle_severity_unique").on(table.testCycleId, table.severity)]);

export const testCycleApplications = pgTable("test_cycle_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  testCycleId: uuid("test_cycle_id").notNull(),
  testerId: uuid("tester_id").notNull(),
  status: applicationStatus("status").default("pending").notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
  decidedBy: uuid("decided_by"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decisionReason: text("decision_reason"),
}, table => [
  uniqueIndex("cycle_application_unique").on(table.testCycleId, table.testerId),
  index("cycle_application_tester_idx").on(table.testerId, table.status),
  index("cycle_application_cycle_idx").on(table.testCycleId, table.status),
]);

export const testCycleInvitations = pgTable("test_cycle_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  testCycleId: uuid("test_cycle_id").notNull(),
  testerId: uuid("tester_id").notNull(),
  invitedBy: uuid("invited_by").notNull(),
  status: invitationStatus("status").default("pending").notNull(),
  createdAt,
  respondedAt: timestamp("responded_at", { withTimezone: true }),
}, table => [
  uniqueIndex("cycle_invitation_unique").on(table.testCycleId, table.testerId),
  index("cycle_invitation_tester_idx").on(table.testerId, table.status),
  index("cycle_invitation_cycle_idx").on(table.testCycleId),
]);

export const testCycleTtls = pgTable("test_cycle_ttls", {
  id: uuid("id").defaultRandom().primaryKey(),
  testCycleId: uuid("test_cycle_id").notNull(),
  testerId: uuid("tester_id").notNull(),
  assignedBy: uuid("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, table => [
  uniqueIndex("cycle_ttl_unique").on(table.testCycleId, table.testerId),
  index("cycle_ttl_tester_idx").on(table.testerId, table.revokedAt),
  index("cycle_ttl_cycle_idx").on(table.testCycleId, table.revokedAt),
]);

export const bugReports = pgTable("bug_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  testCycleId: uuid("test_cycle_id").notNull(),
  testerId: uuid("tester_id").notNull(),
  deviceId: uuid("device_id").notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  category: bugCategory("category").notNull(),
  severity: severityLevel("severity").notNull(),
  stepsToReproduce: text("steps_to_reproduce").notNull(),
  expectedResult: text("expected_result").notNull(),
  actualResult: text("actual_result").notNull(),
  status: bugStatus("status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  requestChangesReason: text("request_changes_reason"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt,
  updatedAt,
}, table => [index("bug_tester_idx").on(table.testerId), index("bug_cycle_idx").on(table.testCycleId), index("bug_status_idx").on(table.status)]);

export const bugReportEvents = pgTable("bug_report_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  bugReportId: uuid("bug_report_id").notNull(),
  actorId: uuid("actor_id").notNull(),
  type: reportEventType("type").notNull(),
  message: text("message"),
  createdAt,
}, table => [index("bug_report_event_report_idx").on(table.bugReportId, table.createdAt)]);

export const bugAttachments = pgTable("bug_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  bugReportId: uuid("bug_report_id"),
  fileKey: varchar("file_key", { length: 512 }).notNull().unique(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedBy: uuid("uploaded_by").notNull(),
  createdAt,
}, table => [index("attachment_bug_idx").on(table.bugReportId), index("attachment_uploader_idx").on(table.uploadedBy)]);

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  availableBalance: numeric("available_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  pendingBalance: numeric("pending_balance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  updatedAt,
}, table => [index("wallet_user_idx").on(table.userId)]);

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletId: uuid("wallet_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: transactionType("type").notNull(),
  referenceType: varchar("reference_type", { length: 60 }).notNull(),
  referenceId: uuid("reference_id").notNull(),
  note: varchar("note", { length: 255 }),
  createdAt,
}, table => [index("transaction_wallet_idx").on(table.walletId)]);

export const payoutRequests = pgTable("payout_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  testerId: uuid("tester_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: payoutMethod("method").notNull(),
  paymentTargetInfo: varchar("payment_target_info", { length: 300 }).notNull(),
  status: payoutStatus("status").default("pending").notNull(),
  processingNote: text("processing_note"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
}, table => [index("payout_tester_idx").on(table.testerId), index("payout_status_idx").on(table.status)]);

export const reputationEvents = pgTable("reputation_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  testerId: uuid("tester_id").notNull(),
  bugReportId: uuid("bug_report_id"),
  points: integer("points").notNull(),
  reason: varchar("reason", { length: 180 }).notNull(),
  createdAt,
}, table => [index("reputation_tester_idx").on(table.testerId)]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  type: notificationType("type").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  entityType: varchar("entity_type", { length: 60 }),
  entityId: uuid("entity_id"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt,
}, table => [index("notification_user_idx").on(table.userId, table.readAt)]);

export type Profile = typeof profiles.$inferSelect;
