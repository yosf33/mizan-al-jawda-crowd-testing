CREATE TABLE `bug_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bugReportId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bug_attachments_id` PRIMARY KEY(`id`),
	CONSTRAINT `bug_attachments_fileKey_unique` UNIQUE(`fileKey`)
);
--> statement-breakpoint
CREATE TABLE `bug_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testCycleId` int NOT NULL,
	`testerId` int NOT NULL,
	`deviceId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`category` enum('functional','ui','performance','crash') NOT NULL,
	`severity` enum('critical','major','minor') NOT NULL,
	`stepsToReproduce` text NOT NULL,
	`expectedResult` text NOT NULL,
	`actualResult` text NOT NULL,
	`status` enum('submitted','under_review','request_changes','triaged','approved','rejected','duplicate') NOT NULL DEFAULT 'submitted',
	`duplicateOfId` int,
	`duplicateReason` text,
	`rejectionReason` text,
	`requestChangesReason` text,
	`triagedBy` int,
	`triagedAt` timestamp,
	`clientDecidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bug_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cycle_bounty_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testCycleId` int NOT NULL,
	`severity` enum('critical','major','minor') NOT NULL,
	`bountyAmount` decimal(12,2) NOT NULL,
	CONSTRAINT `cycle_bounty_rates_id` PRIMARY KEY(`id`),
	CONSTRAINT `cycle_severity_unique` UNIQUE(`testCycleId`,`severity`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('bug_status','payout','system') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`entityType` varchar(60),
	`entityId` int,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payout_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testerId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`method` enum('instapay','vodafone_cash','paypal','bank_transfer') NOT NULL,
	`paymentTargetInfo` varchar(300) NOT NULL,
	`status` enum('pending','processed','rejected') NOT NULL DEFAULT 'pending',
	`processingNote` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `payout_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reputation_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testerId` int NOT NULL,
	`bugReportId` int,
	`points` int NOT NULL,
	`reason` varchar(180) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reputation_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `test_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`scopeDescription` text NOT NULL,
	`outOfScope` text,
	`buildUrl` varchar(2048) NOT NULL,
	`status` enum('draft','active','in_review','completed') NOT NULL DEFAULT 'draft',
	`startAt` timestamp NOT NULL,
	`endAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `test_cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tester_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testerId` int NOT NULL,
	`deviceType` enum('mobile','desktop','tablet') NOT NULL,
	`brandModel` varchar(180) NOT NULL,
	`osName` enum('android','ios','windows','macos','linux') NOT NULL,
	`osVersion` varchar(60) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tester_devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tester_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`country` varchar(80),
	`phoneNumber` varchar(32),
	`payoutMethod` enum('instapay','vodafone_cash','paypal','bank_transfer'),
	`payoutDetails` text,
	`reputationScore` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	CONSTRAINT `tester_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `tester_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`type` enum('bounty_pending','bounty_released','payout_debit','payout_reversal') NOT NULL,
	`referenceType` varchar(60) NOT NULL,
	`referenceId` int NOT NULL,
	`note` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`availableBalance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`pendingBalance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','tester','client','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `attachment_bug_idx` ON `bug_attachments` (`bugReportId`);--> statement-breakpoint
CREATE INDEX `bug_tester_idx` ON `bug_reports` (`testerId`);--> statement-breakpoint
CREATE INDEX `bug_cycle_idx` ON `bug_reports` (`testCycleId`);--> statement-breakpoint
CREATE INDEX `bug_status_idx` ON `bug_reports` (`status`);--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `notifications` (`userId`,`readAt`);--> statement-breakpoint
CREATE INDEX `payout_tester_idx` ON `payout_requests` (`testerId`);--> statement-breakpoint
CREATE INDEX `payout_status_idx` ON `payout_requests` (`status`);--> statement-breakpoint
CREATE INDEX `project_client_idx` ON `projects` (`clientId`);--> statement-breakpoint
CREATE INDEX `reputation_tester_idx` ON `reputation_events` (`testerId`);--> statement-breakpoint
CREATE INDEX `cycle_project_idx` ON `test_cycles` (`projectId`);--> statement-breakpoint
CREATE INDEX `cycle_status_idx` ON `test_cycles` (`status`);--> statement-breakpoint
CREATE INDEX `device_tester_idx` ON `tester_devices` (`testerId`);--> statement-breakpoint
CREATE INDEX `tester_profile_user_idx` ON `tester_profiles` (`userId`);--> statement-breakpoint
CREATE INDEX `transaction_wallet_idx` ON `transactions` (`walletId`);--> statement-breakpoint
CREATE INDEX `wallet_user_idx` ON `wallets` (`userId`);