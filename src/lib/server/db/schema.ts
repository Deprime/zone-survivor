import { randomUUID } from 'node:crypto';
import {
	mysqlTable,
	int,
	bigint,
	boolean,
	smallint,
	varchar,
	timestamp,
	index,
	type AnyMySqlColumn
} from 'drizzle-orm/mysql-core';

/**
 * Пользователи. Регистрация строго через Telegram OAuth.
 */
export const users = mysqlTable(
	'users',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),

		// Публичный идентификатор для реферальной ссылки (генерируется при регистрации).
		uuid: varchar('uuid', { length: 36 })
			.notNull()
			.unique()
			.$defaultFn(() => randomUUID()),

		// Telegram OAuth: id пользователя в Telegram (может превышать диапазон int).
		telegramId: bigint('telegram_id', { mode: 'number', unsigned: true }).notNull().unique(),

		// Чат с ботом для отправки сообщений пользователю.
		chatId: bigint('chat_id', { mode: 'number' }).notNull(),

		// Telegram-username опционален (не у всех он задан).
		username: varchar('username', { length: 255 }),

		// Реферальная система: id пригласившего пользователя (null — пришёл сам).
		parentId: int('parent_id', { unsigned: true }).references((): AnyMySqlColumn => users.id, {
			onDelete: 'set null'
		}),

		// Накопленные токены (0..65535).
		tokens: smallint('tokens', { unsigned: true }).notNull().default(0),

		// Время последнего нажатия «Я жив» — unixtime в секундах.
		activeAt: int('active_at', { unsigned: true }).notNull(),

		// Время гибели персонажа — unixtime в секундах (null, пока жив).
		diedAt: int('died_at', { unsigned: true }),

		// Размер инвентаря (клеток).
		inventorySize: smallint('inventory_size', { unsigned: true }).notNull().default(4),

		// Позиция на карте 128×128 (по умолчанию центр = MAP_START).
		posX: smallint('pos_x', { unsigned: true }).notNull().default(64),
		posY: smallint('pos_y', { unsigned: true }).notNull().default(64),

		// Заражение укусом зомби: сколько ходов осталось найти антидот (null — здоров).
		biteMovesLeft: smallint('bite_moves_left', { unsigned: true }),

		// ISO-неделя (YYYY-WW) последней встречи с зомби — чтобы была ровно раз в неделю.
		zombieWeek: varchar('zombie_week', { length: 8 }),

		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
	},
	(t) => [index('idx_users_chat_id').on(t.chatId), index('idx_users_parent_id').on(t.parentId)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * Предметы в инвентаре пользователя.
 * item_key хранит идентификатор из константы DROP (ammo, antidote, resurrection_cross, …).
 */
export const inventoryItems = mysqlTable(
	'inventory_items',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		userId: int('user_id', { unsigned: true })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		itemKey: varchar('item_key', { length: 64 }).notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('idx_inventory_user_id').on(t.userId)]
);

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;

/**
 * Могилы павших игроков. Появляются на клетке гибели, хранят токены павшего.
 * Нашедший (другой игрок) забирает долю токенов, после чего looted = true.
 */
export const graves = mysqlTable(
	'graves',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		userId: int('user_id', { unsigned: true })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		x: smallint('x', { unsigned: true }).notNull(),
		y: smallint('y', { unsigned: true }).notNull(),
		tokens: smallint('tokens', { unsigned: true }).notNull().default(0),
		looted: boolean('looted').notNull().default(false),
		// Прощальная надпись, которую владелец может оставить в окне после гибели.
		inscription: varchar('inscription', { length: 140 }),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('idx_graves_xy').on(t.x, t.y)]
);

export type Grave = typeof graves.$inferSelect;
export type NewGrave = typeof graves.$inferInsert;

/**
 * Сезоны. id служит номером сезона. Активен ровно один (status='active').
 */
export const seasons = mysqlTable(
	'seasons',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		startsAt: int('starts_at', { unsigned: true }).notNull(),
		endsAt: int('ends_at', { unsigned: true }).notNull(),
		// 'active' | 'finished'
		status: varchar('status', { length: 16 }).notNull().default('active'),
		finishedAt: int('finished_at', { unsigned: true }),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('idx_seasons_status').on(t.status)]
);

export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;

/**
 * Победители сезона (топ-5 на момент завершения).
 */
export const seasonWinners = mysqlTable(
	'season_winners',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		seasonId: int('season_id', { unsigned: true })
			.notNull()
			.references(() => seasons.id, { onDelete: 'cascade' }),
		userId: int('user_id', { unsigned: true })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		rank: smallint('rank', { unsigned: true }).notNull(),
		tokens: smallint('tokens', { unsigned: true }).notNull(),
		prize: varchar('prize', { length: 64 }).notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('idx_season_winners_season').on(t.seasonId)]
);

export type SeasonWinner = typeof seasonWinners.$inferSelect;
export type NewSeasonWinner = typeof seasonWinners.$inferInsert;

/**
 * Платежи через Platega (воскрешение / расширение инвентаря).
 * Источник правды по статусу оплаты; статус меняется callback'ом.
 */
export const payments = mysqlTable(
	'payments',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		userId: int('user_id', { unsigned: true })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		// 'revival' | 'inventory'
		purpose: varchar('purpose', { length: 16 }).notNull(),
		amountRub: smallint('amount_rub', { unsigned: true }).notNull(),
		// 'pending' | 'confirmed' | 'canceled' | 'chargebacked'
		status: varchar('status', { length: 16 }).notNull().default('pending'),
		// transactionId из Platega.
		providerTxId: varchar('provider_tx_id', { length: 64 }),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow()
	},
	(t) => [index('idx_payments_user_id').on(t.userId), index('idx_payments_tx').on(t.providerTxId)]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

/**
 * Игровой журнал событий пользователя (действия игрока и системные события).
 */
export const eventLog = mysqlTable(
	'event_log',
	{
		id: int('id', { unsigned: true }).autoincrement().primaryKey(),
		userId: int('user_id', { unsigned: true })
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		// Тип события для фильтрации/локализации (game, merchant, death, revival, …).
		type: varchar('type', { length: 32 }).notNull(),
		message: varchar('message', { length: 255 }).notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('idx_event_log_user_id').on(t.userId)]
);

export type EventLogEntry = typeof eventLog.$inferSelect;
