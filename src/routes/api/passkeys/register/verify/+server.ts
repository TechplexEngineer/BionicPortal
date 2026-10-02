import { json, error } from "@sveltejs/kit";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { passkey } from "$lib/server/db/schema";
import { consumeChallenge, encodePublicKey, rpSettings, sameOrigin } from "$lib/server/passkeys";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => {
	if (!sameOrigin(event)) error(403, "Invalid origin");
	if (!event.locals.user || event.locals.isImpersonating) error(403, "Sign in to add a passkey");
	const challenge = await consumeChallenge(
		event,
		event.locals.db,
		"register",
		event.locals.user.id
	);
	if (!challenge) error(400, "Passkey request expired. Try again.");
	const { rpID, origin } = rpSettings(event);
	let response: RegistrationResponseJSON;
	try {
		response = await event.request.json();
		if (typeof response?.id !== "string") throw new Error("Invalid response");
	} catch {
		error(400, "Invalid passkey response");
	}
	try {
		const result = await verifyRegistrationResponse({
			response,
			expectedChallenge: challenge,
			expectedOrigin: origin,
			expectedRPID: rpID,
			requireUserVerification: true
		});
		if (!result.verified) error(400, "Passkey verification failed");
		const credential = result.registrationInfo.credential;
		await event.locals.db.insert(passkey).values({
			id: credential.id,
			userId: event.locals.user.id,
			publicKey: encodePublicKey(credential.publicKey),
			counter: credential.counter,
			transports: JSON.stringify(credential.transports ?? []),
			createdAt: new Date(),
			name: "Passkey"
		});
		return json({ verified: true });
	} catch {
		error(400, "Unable to register this passkey");
	}
};
