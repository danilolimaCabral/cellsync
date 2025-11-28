CREATE TABLE `accountsPayable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100),
	`costCenter` varchar(100),
	`supplier` varchar(255),
	`amount` int NOT NULL,
	`dueDate` timestamp NOT NULL,
	`paymentDate` timestamp,
	`status` enum('pendente','pago','atrasado','cancelado') NOT NULL DEFAULT 'pendente',
	`paymentMethod` varchar(50),
	`referenceType` varchar(50),
	`referenceId` int,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountsPayable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accountsReceivable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int,
	`description` text NOT NULL,
	`amount` int NOT NULL,
	`dueDate` timestamp NOT NULL,
	`paymentDate` timestamp,
	`status` enum('pendente','recebido','atrasado','cancelado') NOT NULL DEFAULT 'pendente',
	`paymentMethod` varchar(50),
	`referenceType` varchar(50),
	`referenceId` int,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountsReceivable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entity` varchar(100) NOT NULL,
	`entityId` int,
	`changes` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cashTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('entrada','saida') NOT NULL,
	`category` varchar(100),
	`amount` int NOT NULL,
	`description` text NOT NULL,
	`paymentMethod` varchar(50),
	`referenceType` varchar(50),
	`referenceId` int,
	`userId` int NOT NULL,
	`transactionDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`cpf` varchar(14),
	`cnpj` varchar(18),
	`address` text,
	`city` varchar(100),
	`state` varchar(2),
	`zipCode` varchar(10),
	`birthDate` timestamp,
	`loyaltyPoints` int NOT NULL DEFAULT 0,
	`segment` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketingCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` enum('email','sms','whatsapp','push') NOT NULL,
	`targetSegment` varchar(100),
	`message` text NOT NULL,
	`status` enum('rascunho','agendada','enviada','cancelada') NOT NULL DEFAULT 'rascunho',
	`scheduledFor` timestamp,
	`sentAt` timestamp,
	`recipientsCount` int NOT NULL DEFAULT 0,
	`openedCount` int NOT NULL DEFAULT 0,
	`clickedCount` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketingCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`customerId` int,
	`type` varchar(50) NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`channel` enum('sistema','email','sms','whatsapp') NOT NULL,
	`status` enum('pendente','enviada','falha') NOT NULL DEFAULT 'pendente',
	`sentAt` timestamp,
	`readAt` timestamp,
	`referenceType` varchar(50),
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` varchar(100),
	`brand` varchar(100),
	`model` varchar(100),
	`sku` varchar(100),
	`barcode` varchar(100),
	`costPrice` int NOT NULL,
	`salePrice` int NOT NULL,
	`minStock` int NOT NULL DEFAULT 10,
	`currentStock` int NOT NULL DEFAULT 0,
	`requiresImei` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `saleItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleId` int NOT NULL,
	`productId` int NOT NULL,
	`stockItemId` int,
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`discount` int NOT NULL DEFAULT 0,
	`totalPrice` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saleItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int,
	`sellerId` int NOT NULL,
	`totalAmount` int NOT NULL,
	`discountAmount` int NOT NULL DEFAULT 0,
	`finalAmount` int NOT NULL,
	`status` enum('pendente','concluida','cancelada') NOT NULL DEFAULT 'concluida',
	`paymentMethod` varchar(50),
	`nfeNumber` varchar(100),
	`nfeIssued` boolean NOT NULL DEFAULT false,
	`commission` int NOT NULL DEFAULT 0,
	`notes` text,
	`saleDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceOrderParts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceOrderId` int NOT NULL,
	`productId` int NOT NULL,
	`stockItemId` int,
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`totalPrice` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `serviceOrderParts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `serviceOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`technicianId` int,
	`deviceType` varchar(100),
	`brand` varchar(100),
	`model` varchar(100),
	`imei` varchar(20),
	`serialNumber` varchar(100),
	`defect` text NOT NULL,
	`diagnosis` text,
	`solution` text,
	`status` enum('aberta','em_diagnostico','aguardando_aprovacao','em_reparo','concluida','cancelada','aguardando_retirada') NOT NULL DEFAULT 'aberta',
	`priority` enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
	`estimatedCost` int,
	`finalCost` int,
	`approved` boolean NOT NULL DEFAULT false,
	`approvedAt` timestamp,
	`warrantyDays` int NOT NULL DEFAULT 90,
	`warrantyExpiry` timestamp,
	`notes` text,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `serviceOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`imei` varchar(20),
	`serialNumber` varchar(100),
	`status` enum('disponivel','vendido','reservado','defeito','em_reparo') NOT NULL DEFAULT 'disponivel',
	`location` varchar(100),
	`purchaseDate` timestamp,
	`warrantyExpiry` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `stockItems_imei_unique` UNIQUE(`imei`)
);
--> statement-breakpoint
CREATE TABLE `stockMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`stockItemId` int,
	`type` enum('entrada','saida','transferencia','ajuste','devolucao') NOT NULL,
	`quantity` int NOT NULL,
	`fromLocation` varchar(100),
	`toLocation` varchar(100),
	`userId` int NOT NULL,
	`reason` text,
	`referenceType` varchar(50),
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stockMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`description` text,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','vendedor','tecnico','gerente') NOT NULL DEFAULT 'vendedor';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `openId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;