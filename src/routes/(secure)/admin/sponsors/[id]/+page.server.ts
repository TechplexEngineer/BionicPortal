import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load = (async ({ locals, params }) => {
	const sponsor = await locals.db.query.sponsors.findFirst({
		where: (sponsors, { eq }) => eq(sponsors.id, params.id)
	});
	if (!sponsor) {
		return redirect(302, "/admin/sponsors");
	}
	return { sponsor };
}) satisfies PageServerLoad;

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const level = formData.get("level");
		const logo = formData.get("logo");
		const emailsRaw = formData.get("emails");

		if (typeof name !== "string" || name.trim() === "") {
			return fail(400, { message: "Name is required" });
		}
		if (typeof level !== "string" || level.trim() === "") {
			return fail(400, { message: "Sponsorship level is required" });
		}
		if (typeof emailsRaw !== "string" || emailsRaw.trim() === "") {
			return fail(400, { message: "At least one email is required" });
		}

		const emailList = emailsRaw
			.split(/[\n,]+/)
			.map((e) => e.trim())
			.filter((e) => e.length > 0);

		if (emailList.length === 0) {
			return fail(400, { message: "At least one valid email is required" });
		}

		try {
			await locals.db
				.update(table.sponsors)
				.set({
					name: name.trim(),
					emails: JSON.stringify(emailList),
					logo: typeof logo === "string" && logo.trim() !== "" ? logo.trim() : null,
					level: level.trim()
				})
				.where(eq(table.sponsors.id, params.id));
		} catch {
			return fail(500, { message: "Failed to update sponsor" });
		}

		return redirect(302, "/admin/sponsors");
	},

	delete: async ({ locals, params }) => {
		try {
			await locals.db.delete(table.sponsors).where(eq(table.sponsors.id, params.id));
		} catch {
			return fail(500, { message: "Failed to delete sponsor" });
		}

		return redirect(302, "/admin/sponsors");
	}
};
