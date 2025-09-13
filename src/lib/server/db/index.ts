import { drizzle } from 'drizzle-orm/d1';

export const getDb = (platform: App.Platform | undefined) => {
    const db = platform?.env.bionic_events_db;
    if (!db) {
        console.error(platform);
        throw new Error('D1 Database not found in environment variables');
    }
    return drizzle(db);
}