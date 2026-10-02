import { json, error } from "@sveltejs/kit";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { passkey, user } from "$lib/server/db/schema";
import { consumeChallenge, decodePublicKey, rpSettings, sameOrigin } from "$lib/server/passkeys";
import { getSafeReturnPath } from "$lib/server/authRedirect";
import * as auth from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => {
	if (!sameOrigin(event)) error(403, "Invalid origin");
	const challenge = await consumeChallenge(event, event.locals.db, "login", null);
	if (!challenge) error(400, "Passkey request expired. Try again.");
	let response: AuthenticationResponseJSON;
	let next: string;
	try {
		const body = (await event.request.json()) as {
			response?: AuthenticationResponseJSON;
			next?: string;
		};
		response = body.response!;
		next = getSafeReturnPath(body.next);
		if (typeof response?.id !== "string") throw new Error("Invalid response");
	} catch {
		error(400, "Invalid passkey response");
	}
	const [stored] = await event.locals.db.select().from(passkey).where(eq(passkey.id, response.id));
	if (!stored) error(400, "Unable to sign in with this passkey");
	const { rpID, origin } = rpSettings(event);
	try {
		const result = await verifyAuthenticationResponse({
			response,
			expectedChallenge: challenge,
			expectedOrigin: origin,
			expectedRPID: rpID,
			requireUserVerification: true,
			credential: {
				id: stored.id,
				publicKey: decodePublicKey(stored.publicKey),
				counter: stored.counter,
				transports: JSON.parse(stored.transports) as string[]
			}
		});
		if (!result.verified) error(400, "Unable to sign in with this passkey");
		const [account] = await event.locals.db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.id, stored.userId));
		if (!account) error(400, "Unable to sign in with this passkey");
		await event.locals.db
			.update(passkey)
			.set({ counter: result.authenticationInfo.newCounter })
			.where(eq(passkey.id, stored.id));
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, account.id, event.locals.db);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		return json({ next }, { headers: { "cache-control": "no-store" } });
	} catch {
		error(400, "Unable to sign in with this passkey");
	}
};
