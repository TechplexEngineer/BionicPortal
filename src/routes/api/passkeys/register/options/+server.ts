import { json, error } from "@sveltejs/kit";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { passkey } from "$lib/server/db/schema";
import { rpSettings, sameOrigin, saveChallenge } from "$lib/server/passkeys";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => {
	if (!sameOrigin(event)) error(403, "Invalid origin");
	if (!event.locals.user || event.locals.isImpersonating) error(403, "Sign in to add a passkey");
	const { rpID } = rpSettings(event);
	const user = event.locals.user;
	const existing = await event.locals.db.select().from(passkey).where(eq(passkey.userId, user.id));
	const options = await generateRegistrationOptions({
		rpName: "Bionic Portal",
		rpID,
		userID: new TextEncoder().encode(user.id),
		userName: user.username,
		userDisplayName: user.username,
		attestationType: "none",
		authenticatorSelection: { residentKey: "required", userVerification: "required" },
		excludeCredentials: existing.map((credential) => ({
			id: credential.id,
			transports: JSON.parse(credential.transports) as string[]
		}))
	});
	await saveChallenge(event, event.locals.db, options.challenge, "register", user.id);
	return json(options, { headers: { "cache-control": "no-store" } });
};
