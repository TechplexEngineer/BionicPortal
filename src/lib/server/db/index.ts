// import { drizzle } from 'drizzle-orm/libsql';
// import { createClient } from '@libsql/client';
// import * as schema from './schema';
// import { env } from '$env/dynamic/private';

// if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// const client = createClient({ url: env.DATABASE_URL });

// export const db = drizzle(client, { schema });

import { drizzle } from 'drizzle-orm/d1';

export const getDb = (db: D1Database) => {
    return drizzle(db);
}