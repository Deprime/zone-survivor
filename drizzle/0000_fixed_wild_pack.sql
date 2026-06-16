CREATE TABLE `graves` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`x` smallint unsigned NOT NULL,
	`y` smallint unsigned NOT NULL,
	`tokens` smallint unsigned NOT NULL DEFAULT 0,
	`looted` boolean NOT NULL DEFAULT false,
	`inscription` varchar(140),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `graves_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`item_key` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`purpose` varchar(16) NOT NULL,
	`amount_rub` smallint unsigned NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`provider_tx_id` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `season_winners` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`season_id` int unsigned NOT NULL,
	`user_id` int unsigned NOT NULL,
	`rank` smallint unsigned NOT NULL,
	`tokens` smallint unsigned NOT NULL,
	`prize` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `season_winners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`starts_at` int unsigned NOT NULL,
	`ends_at` int unsigned NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'active',
	`finished_at` int unsigned,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`telegram_id` bigint unsigned NOT NULL,
	`chat_id` bigint NOT NULL,
	`username` varchar(255),
	`parent_id` int unsigned,
	`tokens` smallint unsigned NOT NULL DEFAULT 0,
	`active_at` int unsigned NOT NULL,
	`died_at` int unsigned,
	`inventory_size` smallint unsigned NOT NULL DEFAULT 4,
	`pos_x` smallint unsigned NOT NULL DEFAULT 64,
	`pos_y` smallint unsigned NOT NULL DEFAULT 64,
	`bite_moves_left` smallint unsigned,
	`zombie_week` varchar(8),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `users_telegram_id_unique` UNIQUE(`telegram_id`)
);
--> statement-breakpoint
ALTER TABLE `graves` ADD CONSTRAINT `graves_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_items` ADD CONSTRAINT `inventory_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `season_winners` ADD CONSTRAINT `season_winners_season_id_seasons_id_fk` FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `season_winners` ADD CONSTRAINT `season_winners_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_parent_id_users_id_fk` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_graves_xy` ON `graves` (`x`,`y`);--> statement-breakpoint
CREATE INDEX `idx_inventory_user_id` ON `inventory_items` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_user_id` ON `payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_tx` ON `payments` (`provider_tx_id`);--> statement-breakpoint
CREATE INDEX `idx_season_winners_season` ON `season_winners` (`season_id`);--> statement-breakpoint
CREATE INDEX `idx_seasons_status` ON `seasons` (`status`);--> statement-breakpoint
CREATE INDEX `idx_users_chat_id` ON `users` (`chat_id`);--> statement-breakpoint
CREATE INDEX `idx_users_parent_id` ON `users` (`parent_id`);