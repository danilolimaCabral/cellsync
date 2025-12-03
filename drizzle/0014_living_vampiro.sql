CREATE TABLE `stripe_pending_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(255) NOT NULL,
	`tenant_id` int NOT NULL,
	`user_id` int NOT NULL,
	`processed` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`processed_at` timestamp,
	CONSTRAINT `stripe_pending_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_pending_sessions_session_id_unique` UNIQUE(`session_id`)
);
