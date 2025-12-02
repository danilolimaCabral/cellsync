CREATE TABLE `backupHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`filename` varchar(255) NOT NULL,
	`s3_key` varchar(500) NOT NULL,
	`s3_url` text,
	`file_size` int NOT NULL,
	`status` enum('success','failed','in_progress') NOT NULL DEFAULT 'in_progress',
	`error_message` text,
	`duration` int,
	`backup_type` enum('manual','scheduled') NOT NULL DEFAULT 'scheduled',
	`deleted_count` int DEFAULT 0,
	`triggered_by` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `backupHistory_id` PRIMARY KEY(`id`)
);
