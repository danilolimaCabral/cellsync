CREATE TABLE `modulePermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module_id` int NOT NULL,
	`role` enum('master_admin','admin','gerente','vendedor','tecnico','financeiro') NOT NULL,
	`can_view` boolean NOT NULL DEFAULT false,
	`can_create` boolean NOT NULL DEFAULT false,
	`can_edit` boolean NOT NULL DEFAULT false,
	`can_delete` boolean NOT NULL DEFAULT false,
	`can_approve` boolean NOT NULL DEFAULT false,
	`custom_permissions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `modulePermissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`route_path` varchar(100),
	`active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `modules_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `planModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_id` int NOT NULL,
	`module_id` int NOT NULL,
	`included` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`monthly_price` int NOT NULL,
	`max_users` int,
	`max_storage` int,
	`features` json,
	`active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptionPlans_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `tenantModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL,
	`module_id` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`max_users` int,
	`notes` text,
	`activatedAt` timestamp NOT NULL DEFAULT (now()),
	`activated_by` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenantModules_id` PRIMARY KEY(`id`)
);
