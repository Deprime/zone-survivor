import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';

/**
 * Применяет сгенерированные миграции из ./drizzle к базе.
 * Использует только drizzle-orm + mysql2 (drizzle-kit на проде не нужен).
 * Запуск: `bun run db:deploy`
 */
const url = process.env.DATABASE_URL;
if (!url) {
	throw new Error('DATABASE_URL не задан');
}

const connection = await mysql.createConnection(url);
const db = drizzle(connection);

await migrate(db, { migrationsFolder: './drizzle' });
await connection.end();

console.log('✅ Миграции применены');
