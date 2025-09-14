import bcrypt from "bcryptjs";
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.session || !event.platform) {
		return redirect(302, '/dashboard'); // not sure how to handle this failure case
	}
	await auth.invalidateSession(event.locals.session.id, event.platform);
	auth.deleteSessionTokenCookie(event);

	return redirect(302, '/login');
};
