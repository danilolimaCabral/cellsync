ALTER TABLE `users` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `commission_percentage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `commission_type` enum('percentual','fixo','misto') DEFAULT 'percentual';--> statement-breakpoint
ALTER TABLE `users` ADD `fixed_commission_amount` int DEFAULT 0;