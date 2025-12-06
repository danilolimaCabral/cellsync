CREATE TABLE IF NOT EXISTS `tenant_modules` (
	`id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`tenant_id` int NOT NULL,
	`module_id` varchar(50) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `unique_tenant_module` UNIQUE(`tenant_id`,`module_id`)
);
