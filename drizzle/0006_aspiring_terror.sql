ALTER TABLE `customers` ADD `fantasyName` varchar(255);--> statement-breakpoint
ALTER TABLE `customers` ADD `email2` varchar(320);--> statement-breakpoint
ALTER TABLE `customers` ADD `phone2` varchar(20);--> statement-breakpoint
ALTER TABLE `customers` ADD `rg` varchar(20);--> statement-breakpoint
ALTER TABLE `customers` ADD `stateRegistration` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `grade` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `supplier` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `warehouse` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `entryDate` timestamp;--> statement-breakpoint
ALTER TABLE `stockItems` ADD `batteryHealth` int;--> statement-breakpoint
ALTER TABLE `stockItems` ADD `hasDefect` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `stockItems` ADD `readyForSale` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `stockItems` ADD `stockType` varchar(50);