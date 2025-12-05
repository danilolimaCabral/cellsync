CREATE TABLE `emission_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL DEFAULT 1,
	`saleId` int,
	`type` enum('cupom','nfe','nfce','recibo') NOT NULL,
	`number` int NOT NULL,
	`series` int NOT NULL DEFAULT 1,
	`accessKey` varchar(44),
	`xmlUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emission_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenant_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`module_id` varchar(50) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_modules_tenant_id_module_id_unique` UNIQUE(`tenant_id`,`module_id`)
);
--> statement-breakpoint
ALTER TABLE `tenants` ADD `address` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `phone` varchar(20);