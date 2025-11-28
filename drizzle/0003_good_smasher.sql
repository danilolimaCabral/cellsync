CREATE TABLE `commissionRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text NOT NULL,
	`type` enum('percentual_fixo','meta_progressiva','bonus_produto') NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`percentage` int,
	`minSalesAmount` int,
	`maxSalesAmount` int,
	`productId` int,
	`bonusAmount` int,
	`bonusPercentage` int,
	`priority` int NOT NULL DEFAULT 0,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissionRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`saleId` int,
	`amount` int NOT NULL,
	`baseAmount` int NOT NULL,
	`percentage` int,
	`ruleId` int,
	`status` enum('pendente','aprovada','paga','cancelada') NOT NULL DEFAULT 'pendente',
	`approvedBy` int,
	`approvedAt` timestamp,
	`paidAt` timestamp,
	`paymentId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
