import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { schema } from "$lib/server/db/schema";
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
    namespace App {
        interface Platform {
            env: {
                bionic_events_db: D1Database;
            }
            cf: CfProperties
            ctx: ExecutionContext
        }

        interface Locals {
            user: import('$lib/server/auth').SessionValidationResult['user'];
            session: import('$lib/server/auth').SessionValidationResult['session'];
            db: DrizzleD1Database<schema>;
        }
    } // interface Error {}
    // interface Locals {}
} // interface PageData {}
// interface PageState {}

// interface Platform {}
export { };