import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { contacts } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load = (async ({ locals }) => {
	const allContacts = await locals.db.query.contacts.findMany({
		orderBy: (contacts, { asc }) => [asc(contacts.type), asc(contacts.name)]
	});
	return { contacts: allContacts };
}) satisfies PageServerLoad;

export const actions: Actions = {
	add: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = (formData.get("email") as string)?.trim();
		const name = (formData.get("name") as string)?.trim();
		const type = formData.get("type") as string;

		if (!email || !name || !type) {
			return fail(400, { error: "All fields are required" });
		}

		if (!["parent", "sponsor", "mentor"].includes(type)) {
			return fail(400, { error: "Invalid contact type" });
		}

		try {
			await locals.db
				.insert(contacts)
				.values({ email, name, type: type as "parent" | "sponsor" | "mentor" });
		} catch {
			return fail(400, { error: "A contact with that email already exists" });
		}

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const id = parseInt(formData.get("id") as string);

		if (!id || isNaN(id)) {
			return fail(400, { error: "Invalid contact ID" });
		}

		await locals.db.delete(contacts).where(eq(contacts.id, id));

		return { success: true };
	}
};
