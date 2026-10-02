import { json, error } from "@sveltejs/kit";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { rpSettings, sameOrigin, saveChallenge } from "$lib/server/passkeys";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async (event) => {
	if (!sameOrigin(event)) error(403, "Invalid origin");
	const { rpID } = rpSettings(event);
	const options = await generateAuthenticationOptions({ rpID, userVerification: "required" });
	await saveChallenge(event, event.locals.db, options.challenge, "login", null);
	return json(options, { headers: { "cache-control": "no-store" } });
};
