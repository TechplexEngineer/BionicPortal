import { defineConfig } from "drizzle-kit";
import { glob } from "glob";
import path from "path";

const pathGlob = "./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite";
const files = glob.sync(pathGlob);
const resolvedPath = files.length > 0 ? path.resolve(files[0]) : undefined;

if (!resolvedPath) {
	throw new Error(`No SQLite database file found matching glob: ${pathGlob}`);
}

const dbPath = `file:${resolvedPath}`;

export default defineConfig({
	schema: "./src/lib/server/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: { url: dbPath },
	verbose: true,
	strict: true
});
