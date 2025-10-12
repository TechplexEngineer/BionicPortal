import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
export const getDb = (platform: App.Platform | undefined) => {
	const db = platform?.env.bionic_portal_db;
	if (!db) {
		console.error(platform);
		throw new Error("D1 Database not found in environment variables");
	}
	let drizzleDb = drizzle(db, { schema });
	return drizzleDb;
};
