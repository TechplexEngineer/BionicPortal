import type { DbInstance } from "$lib/server/db";
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: {
				bionic_portal_db: D1Database;
				INTERNAL_API_KEY: string;
				SMUGMUG_API_KEY: string;
				SMUGMUG_API_SECRET: string;
				SMUGMUG_ACCESS_TOKEN: string;
				SMUGMUG_ACCESS_TOKEN_SECRET: string;
				SMUGMUG_NICKNAME: string;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
		}

		interface Locals {
			user: import("$lib/server/auth").SessionValidationResult["user"]; //User | null;
			session: import("$lib/server/auth").SessionValidationResult["session"];
			db: DbInstance;
		}
	} // interface Error {}
	// interface Locals {}
} // interface PageData {}
// interface PageState {}

// interface Platform {}
export {};
