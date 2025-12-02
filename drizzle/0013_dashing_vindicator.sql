ALTER TABLE `plans` ADD `ai_imports_limit` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `plans` ADD `ai_trial_days` int DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `ai_imports_used` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `ai_imports_reset_at` timestamp DEFAULT (now()) NOT NULL;