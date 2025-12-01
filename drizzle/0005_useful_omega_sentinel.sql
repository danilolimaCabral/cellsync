ALTER TABLE `products` ADD `wholesalePrice` int;--> statement-breakpoint
ALTER TABLE `products` ADD `minWholesaleQty` int DEFAULT 5;--> statement-breakpoint
ALTER TABLE `saleItems` ADD `unitPriceType` enum('retail','wholesale') DEFAULT 'retail' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `saleType` enum('retail','wholesale') DEFAULT 'retail' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `appliedDiscount` int DEFAULT 0 NOT NULL;