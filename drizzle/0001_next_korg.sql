CREATE TABLE `event_log` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned NOT NULL,
	`type` varchar(32) NOT NULL,
	`message` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `event_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `event_log` ADD CONSTRAINT `event_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_event_log_user_id` ON `event_log` (`user_id`);