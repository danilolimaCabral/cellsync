CREATE TABLE `chatbot_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`session_id` varchar(255) NOT NULL,
	`user_id` int,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`ended_at` timestamp,
	`message_count` int NOT NULL DEFAULT 0,
	`duration` int DEFAULT 0,
	`converted` boolean NOT NULL DEFAULT false,
	`conversion_type` varchar(50),
	`user_agent` text,
	`ip_address` varchar(45),
	CONSTRAINT `chatbot_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatbot_conversations_session_id_unique` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`event_type` varchar(50) NOT NULL,
	`event_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbot_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`response_time` int,
	`sentiment_score` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbot_messages_id` PRIMARY KEY(`id`)
);
