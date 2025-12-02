ALTER TABLE `tenants` ADD `cnpj` varchar(18);--> statement-breakpoint
ALTER TABLE `tenants` ADD `razao_social` varchar(255);--> statement-breakpoint
ALTER TABLE `tenants` ADD `nome_fantasia` varchar(255);--> statement-breakpoint
ALTER TABLE `tenants` ADD `endereco` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `cidade` varchar(100);--> statement-breakpoint
ALTER TABLE `tenants` ADD `estado` varchar(2);--> statement-breakpoint
ALTER TABLE `tenants` ADD `cep` varchar(10);--> statement-breakpoint
ALTER TABLE `tenants` ADD `telefone` varchar(20);--> statement-breakpoint
ALTER TABLE `tenants` ADD `email` varchar(320);