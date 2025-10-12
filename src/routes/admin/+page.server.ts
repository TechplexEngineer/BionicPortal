import type { PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import * as schema from "$lib/server/db/schema";

export const load = (async ({ locals }) => {
	console.log("Loading admin page...");

	const events = await locals.db.query.events.findMany();

	return { events };
}) satisfies PageServerLoad;

export const actions: Actions = {
	createEvent: async ({ request, locals }) => {
		console.log("Creating event...");
		const formData = await request.formData();
		const name = formData.get("name");
		const date = formData.get("date");

		if (!name || !date) {
			return fail(400, { error: "Name and date are required." });
		}
		console.log("Creating event...2");
		// TODO: Save the event to your database here
		await locals.db.insert(schema.events).values({
			data: {
				name: name.toString(),
				date: new Date(date.toString()),
				location: formData.get("location")?.toString() || "",
				description: formData.get("description")?.toString() || ""
			}
		});
		console.log("Event created:3", name, date);

		// Redirect to the admin page after creation
		throw redirect(303, "/admin");
	}
};
