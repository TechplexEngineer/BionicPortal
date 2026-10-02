import { fail, redirect } from "@sveltejs/kit";
import { and, eq, gt, sql } from "drizzle-orm";
import * as auth from "$lib/server/auth";
import { findOrCreateUserByEmail } from "$lib/server/emailAuth";
import { consumeMagicLink, hashMagicLinkToken, isMagicLinkToken } from "$lib/server/magicLinks";
import { magicCodes, passkey, user } from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
import { getSafeReturnPath } from "$lib/server/authRedirect";

export const load: PageServerLoad = async (event) => {
	const token = event.url.searchParams.get("token");
	let showPasskeySetup = false;
	if (isMagicLinkToken(token)) {
		const [link] = await event.locals.db
			.select({ email: magicCodes.email })
			.from(magicCodes)
			.where(
				and(eq(magicCodes.code, hashMagicLinkToken(token)), gt(magicCodes.expiresAt, new Date()))
			);
		if (link) {
			const accounts = await event.locals.db
				.select({ id: user.id })
				.from(user)
				.where(sql`lower(trim(${user.username})) = ${link.email}`)
				.limit(2);
			if (accounts.length === 0) showPasskeySetup = true;
			else if (accounts.length === 1) {
				const [existing] = await event.locals.db
					.select({ id: passkey.id })
					.from(passkey)
					.where(eq(passkey.userId, accounts[0].id))
					.limit(1);
				showPasskeySetup = !existing;
			}
		}
	}
	return {
		token: isMagicLinkToken(token) ? token : null,
		next: getSafeReturnPath(event.url.searchParams.get("next")),
		showPasskeySetup
	};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const rawNext = formData.get("next");
		const next = getSafeReturnPath(typeof rawNext === "string" ? rawNext : null);
		const db = event.locals.db;
		const email = await consumeMagicLink(db, formData.get("token"));
		if (!email)
			return fail(400, { message: "This sign-in link is invalid or expired. Request a new link." });
		const result = await findOrCreateUserByEmail(db, email);
		if (result.ambiguous || !result.user)
			return fail(400, { message: "Unable to sign in. Please contact your administrator." });
		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, result.user.id, db);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		if (formData.get("setupPasskey") === "1") {
			const [existing] = await db
				.select({ id: passkey.id })
				.from(passkey)
				.where(eq(passkey.userId, result.user.id))
				.limit(1);
			if (!existing) redirect(303, `/account/passkeys?next=${encodeURIComponent(next)}`);
		}
		redirect(303, next);
	}
};
