CREATE TABLE `salesGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenant_id` int NOT NULL DEFAULT 1,
	`name` varchar(255) NOT NULL,
	`type` enum('vendedor','produto','loja','geral') NOT NULL,
	`userId` int,
	`productId` int,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`targetAmount` int NOT NULL,
	`targetQuantity` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salesGoals_id` PRIMARY KEY(`id`)
);
