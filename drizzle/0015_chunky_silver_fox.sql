ALTER TABLE `tenants` ADD `cnpj` varchar(14);--> statement-breakpoint
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_cnpj_unique` UNIQUE(`cnpj`);