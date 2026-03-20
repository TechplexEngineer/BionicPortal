import bcrypt from "bcryptjs";
import { encodeBase32LowerCase } from "@oslojs/encoding";
import { fail, redirect } from "@sveltejs/kit";
import * as table from "$lib/server/db/schema";
import { ROLES } from "$lib/roles";
import type { Actions, PageServerLoad } from "./$types";

export const load = (() => {
	return { roles: ROLES };
}) satisfies PageServerLoad;

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const formData = await request.formData();
		const username = formData.get("username");
		const password = formData.get("password");
		const role = formData.get("role");

		if (typeof username !== "string" || username.length < 3 || username.length > 63) {
			return fail(400, { message: "Invalid username (min 3, max 63 characters)", username: "" });
		}

		if (typeof password !== "string" || password.length < 6 || password.length > 255) {
			return fail(400, {
				message: "Invalid password (min 6, max 255 characters)",
				username: username as string
			});
		}

		if (typeof role !== "string" || !(ROLES as readonly string[]).includes(role)) {
			return fail(400, { message: "Invalid role", username: username as string });
		}

		const userId = generateUserId();
		const passwordHash = await bcrypt.hash(password, 12);

		try {
			await locals.db.insert(table.user).values({ id: userId, username, passwordHash, role });
		} catch {
			return fail(500, {
				message: "Username already exists or an error occurred",
				username: username as string
			});
		}

		return redirect(302, "/admin/users");
	}
};

function generateUserId() {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase32LowerCase(bytes);
}
