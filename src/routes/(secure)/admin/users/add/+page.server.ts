import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { getDb } from "$lib/server/db";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	// Let the layout handle base admin permissions
	return {};
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get("email");
		const role = formData.get("role");

		if (typeof email !== "string" || !email.includes("@")) {
			return fail(400, { message: "Invalid email address" });
		}
		
		if (typeof role !== "string" || !["user", "admin", "mentor"].includes(role)) {
			return fail(400, { message: "Invalid role" });
		}

		const username = email.toLowerCase().trim();
		const db = getDb(event.platform);

		try {
			// Check if user already exists
			const [existingUser] = await db.select()
				.from(table.user)
				.where(eq(table.user.username, username));

			if (existingUser) {
				return fail(400, { message: "A user with this email already exists." });
			}

			// Insert user
			const userId = crypto.randomUUID();
			await db.insert(table.user).values({
				id: userId,
				username: username,
				passwordHash: "MAGIC_LINK_ONLY",
				role: role
			});

		} catch (e) {
			console.error("[Add User] Error:", e);
			return fail(500, { message: "Failed to create user. Please try again later." });
		}

		// Redirect on success
		return redirect(302, "/admin/users");
	}
};
