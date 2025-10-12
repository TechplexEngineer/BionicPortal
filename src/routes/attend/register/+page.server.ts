import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { Actions } from "./$types";
import { httpCode } from "$lib/httpcodes";

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;
export const actions: Actions = {
	register: async ({ request }) => {
		const formData = await request.formData();
		const firstname = formData.get("firstname")?.toString().trim();
		const lastname = formData.get("lastname")?.toString().trim();
		const email = formData.get("email")?.toString().trim();

		// You can add validation or database logic here
		if (!email?.endsWith("@billericak12.com")) {
			return fail(httpCode.badRequest, {
				error: "Email must end with @billericak12.com"
			});
		}
		if (!firstname || !lastname || !email) {
			return fail(httpCode.badRequest, {
				error: "All fields are required"
			});
		}

		console.log(`Registering ${firstname} ${lastname} with email ${email}`);


		return redirect(303, "/attend");
	}
};