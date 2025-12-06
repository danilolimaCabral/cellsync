CREATE TABLE `backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL DEFAULT 1,
	`filename` varchar(255) NOT NULL,
	`size` int NOT NULL,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`s3Url` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `emission_logs` MODIFY COLUMN `series` int NOT NULL;--> statement-breakpoint
ALTER TABLE `emission_logs` ADD `tenant_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `emission_logs` ADD `sale_id` int;--> statement-breakpoint
ALTER TABLE `emission_logs` ADD `access_key` varchar(44);--> statement-breakpoint
ALTER TABLE `emission_logs` ADD `xml_url` text;--> statement-breakpoint
ALTER TABLE `emission_logs` ADD `status` enum('autorizada','cancelada','rejeitada','contingencia') DEFAULT 'autorizada' NOT NULL;--> statement-breakpoint
ALTER TABLE `emission_logs` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `fiscal_settings` ADD `nfe_series` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `fiscal_settings` ADD `next_nfce_number` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `fiscal_settings` ADD `nfce_series` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `tenantId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `emission_logs` DROP COLUMN `tenantId`;--> statement-breakpoint
ALTER TABLE `emission_logs` DROP COLUMN `saleId`;--> statement-breakpoint
ALTER TABLE `emission_logs` DROP COLUMN `accessKey`;--> statement-breakpoint
ALTER TABLE `emission_logs` DROP COLUMN `xmlUrl`;--> statement-breakpoint
ALTER TABLE `emission_logs` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `fiscal_settings` DROP COLUMN `series`;