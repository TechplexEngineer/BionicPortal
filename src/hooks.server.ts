import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { sequence } from '@sveltejs/kit/hooks';

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

const addDbToLocals: Handle = async ({ event, resolve }) => {
	if (event.request.url === "http://sveltekit-prerender/[fallback]") {
		// Don't inject for fallback pre-rendering
		return resolve(event);
	}
	if (!event.platform?.env?.DB) {
		throw new Error('D1 Database not found in environment variables');
	}

	event.locals.db = getDb(event.platform.env.DB);
	return resolve(event);
}

export const handle: Handle = sequence(
	handleAuth,
	addDbToLocals
);
