ALTER TABLE `tenants` ADD `cnpj` varchar(18);--> statement-breakpoint
ALTER TABLE `tenants` ADD `razao_social` varchar(255);--> statement-breakpoint
ALTER TABLE `tenants` ADD `inscricao_estadual` varchar(50);--> statement-breakpoint
ALTER TABLE `tenants` ADD `inscricao_municipal` varchar(50);--> statement-breakpoint
ALTER TABLE `tenants` ADD `cep` varchar(9);--> statement-breakpoint
ALTER TABLE `tenants` ADD `logradouro` varchar(255);--> statement-breakpoint
ALTER TABLE `tenants` ADD `numero` varchar(20);--> statement-breakpoint
ALTER TABLE `tenants` ADD `complemento` varchar(100);--> statement-breakpoint
ALTER TABLE `tenants` ADD `bairro` varchar(100);--> statement-breakpoint
ALTER TABLE `tenants` ADD `cidade` varchar(100);--> statement-breakpoint
ALTER TABLE `tenants` ADD `estado` varchar(2);--> statement-breakpoint
ALTER TABLE `tenants` ADD `telefone` varchar(20);--> statement-breakpoint
ALTER TABLE `tenants` ADD `celular` varchar(20);--> statement-breakpoint
ALTER TABLE `tenants` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `tenants` ADD `site` varchar(255);--> statement-breakpoint
ALTER TABLE `tenants` ADD `regime_tributario` enum('simples_nacional','lucro_presumido','lucro_real','mei');