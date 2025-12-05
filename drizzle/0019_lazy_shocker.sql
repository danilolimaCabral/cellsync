CREATE TABLE `accounting_posting_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`posting_id` int NOT NULL,
	`account_id` int NOT NULL,
	`debit_amount` int NOT NULL DEFAULT 0,
	`credit_amount` int NOT NULL DEFAULT 0,
	`description` varchar(255),
	CONSTRAINT `accounting_posting_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accounting_postings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`posting_date` date NOT NULL,
	`posting_number` varchar(50) NOT NULL,
	`reference_type` enum('sale','purchase','payment','receipt','adjustment') NOT NULL,
	`reference_id` int,
	`reference_document` varchar(100),
	`description` text,
	`status` enum('draft','posted','cancelled') NOT NULL DEFAULT 'draft',
	`posted_by` int,
	`posted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounting_postings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chart_of_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`account_code` varchar(50) NOT NULL,
	`account_name` varchar(255) NOT NULL,
	`account_type` enum('asset','liability','equity','revenue','expense') NOT NULL,
	`parent_account_id` int,
	`is_analytical` boolean NOT NULL DEFAULT true,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chart_of_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financial_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`sale_id` int,
	`nfe_id` int,
	`record_type` enum('revenue','expense','receivable','payable') NOT NULL,
	`due_date` date NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','paid','cancelled','overdue') NOT NULL DEFAULT 'pending',
	`paid_amount` int DEFAULT 0,
	`paid_at` timestamp,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financial_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posting_template_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`template_id` int NOT NULL,
	`account_id` int NOT NULL,
	`type` enum('debit','credit') NOT NULL,
	`debit_percentage` int NOT NULL DEFAULT 0,
	`credit_percentage` int NOT NULL DEFAULT 0,
	`description_template` varchar(255),
	`line_number` int NOT NULL,
	CONSTRAINT `posting_template_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posting_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`template_type` enum('sale','sale_return','payment','receipt','adjustment') NOT NULL,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posting_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_calculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sale_id` int NOT NULL,
	`tax_type` enum('icms','pis','cofins','ipi','iss') NOT NULL,
	`tax_base` int NOT NULL,
	`tax_rate` int NOT NULL,
	`tax_amount` int NOT NULL,
	`tax_account_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tax_calculations_id` PRIMARY KEY(`id`)
);
