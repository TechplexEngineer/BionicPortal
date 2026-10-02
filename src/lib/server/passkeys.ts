import { eq, and, lt } from "drizzle-orm";
import { encodeBase64url, decodeBase64url } from "@oslojs/encoding";
import type { RequestEvent } from "@sveltejs/kit";
import type { DbInstance } from "$lib/server/db";
import { passkeyChallenge } from "$lib/server/db/schema";

export const challengeCookie = "passkey-challenge";
const challengeLifetime = 5 * 60 * 1000;
type Ceremony = "register" | "login";

export function rpSettings(event: Pick<RequestEvent, "url">) {
	if (event.url.protocol !== "https:" && event.url.hostname !== "localhost") {
		throw new Error("Passkeys require HTTPS or localhost");
	}
	return { rpID: event.url.hostname, origin: event.url.origin };
}

export function sameOrigin(event: Pick<RequestEvent, "request" | "url">) {
	return event.request.headers.get("origin") === event.url.origin;
}

export async function saveChallenge(
	event: Pick<RequestEvent, "cookies" | "url">,
	db: DbInstance,
	challenge: string,
	ceremony: Ceremony,
	userId: string | null
) {
	const id = encodeBase64url(crypto.getRandomValues(new Uint8Array(32)));
	await db.delete(passkeyChallenge).where(lt(passkeyChallenge.expiresAt, new Date()));
	await db.insert(passkeyChallenge).values({
		id,
		challenge,
		ceremony,
		userId,
		expiresAt: new Date(Date.now() + challengeLifetime)
	});
	event.cookies.set(challengeCookie, id, {
		path: "/",
		httpOnly: true,
		sameSite: "strict",
		secure: event.url.protocol === "https:",
		maxAge: challengeLifetime / 1000
	});
}

export async function consumeChallenge(
	event: Pick<RequestEvent, "cookies">,
	db: DbInstance,
	ceremony: Ceremony,
	userId: string | null
) {
	const id = event.cookies.get(challengeCookie);
	event.cookies.delete(challengeCookie, { path: "/" });
	if (!id) return null;
	const [row] = await db
		.delete(passkeyChallenge)
		.where(and(eq(passkeyChallenge.id, id), eq(passkeyChallenge.ceremony, ceremony)))
		.returning();
	if (!row || row.expiresAt.getTime() < Date.now() || row.userId !== userId) return null;
	return row.challenge;
}

export function encodePublicKey(key: Uint8Array) {
	return encodeBase64url(key);
}

export function decodePublicKey(key: string) {
	return Uint8Array.from(decodeBase64url(key));
}
