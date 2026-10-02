import { createRequire } from "node:module";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { consumeChallenge, rpSettings, sameOrigin, saveChallenge } from "./passkeys";
import type { DbInstance } from "./db";

const Database = createRequire(import.meta.url)("better-sqlite3");

describe("passkey challenges", () => {
	let sqlite: ReturnType<typeof Database>;
	let db: DbInstance;
	let values: Map<string, string>;
	let event: Parameters<typeof saveChallenge>[0];

	beforeEach(() => {
		sqlite = new Database(":memory:");
		sqlite.exec(`CREATE TABLE passkey_challenge (
			id TEXT PRIMARY KEY, challenge TEXT NOT NULL, ceremony TEXT NOT NULL,
			user_id TEXT, expires_at INTEGER NOT NULL
		)`);
		db = drizzle(sqlite) as unknown as DbInstance;
		values = new Map();
		event = {
			url: new URL("https://portal.example.org/account/passkeys"),
			cookies: {
				get: vi.fn((name: string) => values.get(name)),
				set: vi.fn((name: string, value: string) => values.set(name, value)),
				delete: vi.fn((name: string) => values.delete(name))
			}
		} as unknown as typeof event;
	});

	afterEach(() => sqlite.close());

	it("consumes a challenge once and binds registration to its user", async () => {
		await saveChallenge(event, db, "challenge", "register", "user-1");
		expect(await consumeChallenge(event, db, "register", "user-2")).toBeNull();
		expect(sqlite.prepare("SELECT count(*) AS count FROM passkey_challenge").get().count).toBe(0);
		await saveChallenge(event, db, "second", "register", "user-1");
		expect(await consumeChallenge(event, db, "register", "user-1")).toBe("second");
		expect(await consumeChallenge(event, db, "register", "user-1")).toBeNull();
	});

	it("rejects expired challenges", async () => {
		await saveChallenge(event, db, "challenge", "login", null);
		sqlite.prepare("UPDATE passkey_challenge SET expires_at = 1").run();
		expect(await consumeChallenge(event, db, "login", null)).toBeNull();
	});

	it("requires matching origin and a secure RP context", () => {
		const request = new Request("https://portal.example.org", {
			method: "POST",
			headers: { origin: "https://evil.example.org" }
		});
		expect(sameOrigin({ request, url: event.url })).toBe(false);
		expect(rpSettings(event)).toEqual({
			rpID: "portal.example.org",
			origin: "https://portal.example.org"
		});
		expect(() => rpSettings({ url: new URL("http://portal.example.org") })).toThrow();
	});
});
