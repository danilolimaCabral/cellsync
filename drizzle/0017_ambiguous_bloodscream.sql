CREATE TABLE `digital_certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_url` text NOT NULL,
	`password` text NOT NULL,
	`expiration_date` timestamp NOT NULL,
	`issuer` varchar(255),
	`serial_number` varchar(255),
	`thumbprint` varchar(255),
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `digital_certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fiscal_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`environment` enum('homologacao','producao') NOT NULL DEFAULT 'homologacao',
	`csc_token` varchar(255),
	`csc_id` varchar(10),
	`next_nfe_number` int NOT NULL DEFAULT 1,
	`series` int NOT NULL DEFAULT 1,
	`simple_national` boolean NOT NULL DEFAULT true,
	`tax_regime` varchar(1) DEFAULT '1',
	`default_ncm` varchar(8),
	`default_cfop_state` varchar(4) DEFAULT '5102',
	`default_cfop_interstate` varchar(4) DEFAULT '6102',
	`certificate_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fiscal_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `fiscal_settings_tenant_id_unique` UNIQUE(`tenant_id`)
);
