import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import * as auth from "$lib/server/auth";
import type { Actions, PageServerLoad } from "./$types";

export const load = (async ({ locals }) => {
	const users = await locals.db.query.user.findMany();
	return {
		users,
		canImpersonate: locals.user?.username.trim().toLowerCase() === "blake@team4909.org"
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	delete: async ({ locals, request }) => {
		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string" || id.trim() === "") {
			return fail(400, { message: "Invalid user ID" });
		}

		if (locals.user?.id === id) {
			return fail(400, { message: "You cannot delete your own account" });
		}

		await locals.db.delete(table.user).where(eq(table.user.id, id));
		return { success: true };
	},

	impersonate: async ({ cookies, locals, request, url }) => {
		if (locals.user?.username.trim().toLowerCase() !== "blake@team4909.org") {
			return fail(403, { message: "Only Blake can impersonate users" });
		}

		const formData = await request.formData();
		const id = formData.get("id");
		if (typeof id !== "string" || id.trim() === "") {
			return fail(400, { message: "Invalid user ID" });
		}
		if (locals.user.id === id) {
			return fail(400, { message: "You cannot impersonate yourself" });
		}

		const target = await locals.db.query.user.findFirst({
			where: (user, { eq }) => eq(user.id, id)
		});
		if (!target) {
			return fail(404, { message: "User not found" });
		}

		const originToken = cookies.get(auth.sessionCookieName);
		if (!originToken) {
			return fail(401, { message: "Your session has expired" });
		}

		const targetToken = auth.generateSessionToken();
		const targetSession = await auth.createSession(targetToken, target.id, locals.db);
		cookies.set(auth.impersonationOriginCookieName, originToken, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: url.protocol === "https:",
			maxAge: 60 * 60
		});
		auth.setSessionTokenCookie(cookies, targetToken, targetSession.expiresAt);
		throw redirect(303, "/dashboard");
	}
};
