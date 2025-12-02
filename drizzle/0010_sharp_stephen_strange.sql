CREATE TABLE `support_ticket_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` int NOT NULL,
	`user_id` int NOT NULL,
	`message` text NOT NULL,
	`is_internal` boolean NOT NULL DEFAULT false,
	`attachments` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_ticket_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`tenant_id` int,
	`subject` varchar(255) NOT NULL,
	`category` enum('duvida','problema_tecnico','solicitacao_recurso','bug') NOT NULL,
	`priority` enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
	`status` enum('aberto','em_andamento','resolvido','fechado') NOT NULL DEFAULT 'aberto',
	`description` text NOT NULL,
	`assigned_to` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolved_at` timestamp,
	`closed_at` timestamp,
	CONSTRAINT `support_tickets_id` PRIMARY KEY(`id`)
);
