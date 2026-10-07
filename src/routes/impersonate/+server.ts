import { redirect, type RequestHandler } from "@sveltejs/kit";
import * as auth from "$lib/server/auth";

export const POST: RequestHandler = async ({ cookies, locals, platform }) => {
	const originToken = cookies.get(auth.impersonationOriginCookieName);
	if (!originToken) {
		throw redirect(303, "/dashboard");
	}

	if (locals.session && platform) {
		await auth.invalidateSession(locals.session.id, platform);
	}

	const { session, user } = await auth.validateSessionToken(originToken, locals.db);
	if (!session || !user) {
		auth.deleteSessionTokenCookie({ cookies });
		cookies.delete(auth.impersonationOriginCookieName, { path: "/" });
		throw redirect(303, "/login");
	}

	auth.setSessionTokenCookie({ cookies }, originToken, session.expiresAt);
	cookies.delete(auth.impersonationOriginCookieName, { path: "/" });
	throw redirect(303, user.role === "admin" || user.role === "mentor" ? "/admin" : "/dashboard");
};
