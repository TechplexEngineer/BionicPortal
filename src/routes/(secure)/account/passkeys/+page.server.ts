import { fail, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { passkey } from "$lib/server/db/schema";
import { getLoginUrl } from "$lib/server/authRedirect";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(302, getLoginUrl(url));
	return {
		passkeys: await locals.db
			.select({ id: passkey.id, name: passkey.name, createdAt: passkey.createdAt })
			.from(passkey)
			.where(eq(passkey.userId, locals.user.id)),
		isImpersonating: locals.isImpersonating
	};
};

export const actions: Actions = {
	remove: async ({ locals, request }) => {
		if (!locals.user || locals.isImpersonating) return fail(403, { message: "Unavailable" });
		const data = await request.formData();
		const id = data.get("id");
		if (typeof id !== "string") return fail(400, { message: "Invalid passkey" });
		const removed = await locals.db
			.delete(passkey)
			.where(and(eq(passkey.id, id), eq(passkey.userId, locals.user.id)))
			.returning({ id: passkey.id });
		if (!removed.length) return fail(404, { message: "Passkey not found" });
		return { message: "Passkey removed" };
	}
};
