CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`description` text,
	`price_monthly` int NOT NULL,
	`price_yearly` int,
	`stripe_price_id_monthly` varchar(255),
	`stripe_price_id_yearly` varchar(255),
	`max_users` int NOT NULL DEFAULT 1,
	`max_products` int NOT NULL DEFAULT 500,
	`max_storage` int NOT NULL DEFAULT 1024,
	`features` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subdomain` varchar(63) NOT NULL,
	`customDomain` varchar(255),
	`logo` text,
	`plan_id` int NOT NULL,
	`status` enum('active','suspended','cancelled','trial') NOT NULL DEFAULT 'trial',
	`trial_ends_at` timestamp,
	`stripe_customer_id` varchar(255),
	`stripe_subscription_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_subdomain_unique` UNIQUE(`subdomain`)
);
