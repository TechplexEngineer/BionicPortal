import { fail, redirect } from "@sveltejs/kit";
import { encodeBase32LowerCase } from "@oslojs/encoding";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load = (() => {
	return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
	create: async ({ request, locals }) => {
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

		const id = generateId();

		try {
			await locals.db.insert(table.sponsors).values({
				id,
				name: name.trim(),
				emails: JSON.stringify(emailList),
				logo: typeof logo === "string" && logo.trim() !== "" ? logo.trim() : null,
				level: level.trim()
			});
		} catch {
			return fail(500, { message: "Failed to create sponsor" });
		}

		return redirect(302, "/admin/sponsors");
	}
};

function generateId() {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	return encodeBase32LowerCase(bytes);
}
