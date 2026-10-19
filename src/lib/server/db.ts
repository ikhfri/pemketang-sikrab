import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import 'dotenv/config';
console.log(
	'[DB]',
	process.env.DATABASE_URL
		? 'DATABASE_URL tersedia'
		: 'DATABASE_URL TIDAK tersedia'
);

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false
	}
});

export const db = drizzle(pool);