import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load = (async ({ locals }) => {
	const users = await locals.db.query.user.findMany();
	return { users };
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
	}
};
