import { createRequire } from "node:module";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { encodeBase64url } from "@oslojs/encoding";
import type { DbInstance } from "$lib/server/db";
import { saveChallenge } from "$lib/server/passkeys";

vi.mock("@simplewebauthn/server", () => ({
	generateRegistrationOptions: vi.fn(async () => ({ challenge: "registration-challenge" })),
	verifyRegistrationResponse: vi.fn(async () => ({
		verified: true,
		registrationInfo: {
			credential: { id: "credential-1", publicKey: new Uint8Array([1, 2, 3]), counter: 0 }
		}
	})),
	generateAuthenticationOptions: vi.fn(async () => ({ challenge: "login-challenge" })),
	verifyAuthenticationResponse: vi.fn(async () => ({
		verified: true,
		authenticationInfo: { newCounter: 1 }
	}))
}));

import { POST as registerOptions } from "./register/options/+server";
import { POST as registerVerify } from "./register/verify/+server";
import { POST as loginOptions } from "./login/options/+server";
import { POST as loginVerify } from "./login/verify/+server";

const Database = createRequire(import.meta.url)("better-sqlite3");

describe("passkey routes", () => {
	let sqlite: ReturnType<typeof Database>;
	let db: DbInstance;
	let cookies: Map<string, string>;
	function event(path: string, body: object, signedIn = false, impersonating = false) {
		const url = new URL(`https://portal.example.org${path}`);
		return {
			url,
			request: new Request(url, {
				method: "POST",
				headers: { origin: url.origin, "content-type": "application/json" },
				body: JSON.stringify(body)
			}),
			locals: {
				db,
				user: signedIn ? { id: "user-1", username: "person@example.org" } : null,
				isImpersonating: impersonating
			},
			cookies: {
				get: vi.fn((name: string) => cookies.get(name)),
				set: vi.fn((name: string, value: string) => cookies.set(name, value)),
				delete: vi.fn((name: string) => cookies.delete(name))
			}
		};
	}

	beforeEach(() => {
		sqlite = new Database(":memory:");
		sqlite.exec(`CREATE TABLE user (id TEXT PRIMARY KEY, username TEXT NOT NULL);
			CREATE TABLE session (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL);
			CREATE TABLE passkey (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, public_key TEXT NOT NULL,
				counter INTEGER NOT NULL, transports TEXT NOT NULL, created_at INTEGER NOT NULL, name TEXT NOT NULL);
			CREATE TABLE passkey_challenge (id TEXT PRIMARY KEY, challenge TEXT NOT NULL, ceremony TEXT NOT NULL,
				user_id TEXT, expires_at INTEGER NOT NULL);
			INSERT INTO user VALUES ('user-1', 'person@example.org');`);
		db = drizzle(sqlite) as unknown as DbInstance;
		cookies = new Map();
	});
	afterEach(() => sqlite.close());

	it("requires a real signed-in session for registration", async () => {
		await expect(
			registerOptions(event("/api/passkeys/register/options", {}, false) as never)
		).rejects.toMatchObject({ status: 403 });
		await expect(
			registerOptions(event("/api/passkeys/register/options", {}, true, true) as never)
		).rejects.toMatchObject({ status: 403 });
		const response = await registerOptions(
			event("/api/passkeys/register/options", {}, true) as never
		);
		expect(response.status).toBe(200);
		expect(cookies.size).toBe(1);
	});

	it("rejects cross-origin passkey requests", async () => {
		const input = event("/api/passkeys/login/options", {});
		input.request.headers.set("origin", "https://evil.example.org");
		await expect(loginOptions(input as never)).rejects.toMatchObject({ status: 403 });
		expect(sqlite.prepare("SELECT count(*) AS count FROM passkey_challenge").get().count).toBe(0);
	});

	it("registers for the session user and consumes the challenge", async () => {
		const input = event("/api/passkeys/register/verify", { id: "credential-1" }, true);
		await saveChallenge(input as never, db, "registration-challenge", "register", "user-1");
		expect((await registerVerify(input as never)).status).toBe(200);
		expect(sqlite.prepare("SELECT user_id, public_key FROM passkey").get()).toEqual({
			user_id: "user-1",
			public_key: encodeBase64url(new Uint8Array([1, 2, 3]))
		});
		await expect(
			registerVerify(event("/api/passkeys/register/verify", { id: "credential-1" }, true) as never)
		).rejects.toMatchObject({ status: 400 });
	});

	it("creates the existing session after assertion and rejects replay", async () => {
		const options = await loginOptions(event("/api/passkeys/login/options", {}) as never);
		expect(options.status).toBe(200);
		sqlite
			.prepare("INSERT INTO passkey VALUES (?, ?, ?, ?, ?, ?, ?)")
			.run(
				"credential-1",
				"user-1",
				encodeBase64url(new Uint8Array([1, 2, 3])),
				0,
				"[]",
				Date.now(),
				"Passkey"
			);
		const input = event("/api/passkeys/login/verify", {
			response: { id: "credential-1" },
			next: "/dashboard"
		});
		const response = await loginVerify(input as never);
		expect(await response.json()).toEqual({ next: "/dashboard" });
		expect(sqlite.prepare("SELECT user_id FROM session").get()).toEqual({ user_id: "user-1" });
		expect(sqlite.prepare("SELECT counter FROM passkey").get()).toEqual({ counter: 1 });
		await expect(
			loginVerify(
				event("/api/passkeys/login/verify", { response: { id: "credential-1" } }) as never
			)
		).rejects.toMatchObject({ status: 400 });
	});
});
