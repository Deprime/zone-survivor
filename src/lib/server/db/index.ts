import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL не задан в .env');
}

// Пул соединений переиспользуется между запросами (и переживает HMR в dev).
const globalForDb = globalThis as unknown as { __mysqlPool?: mysql.Pool };

const pool = globalForDb.__mysqlPool ?? mysql.createPool(env.DATABASE_URL);
if (import.meta.env.DEV) globalForDb.__mysqlPool = pool;

export const db = drizzle(pool, { schema, mode: 'default' });
