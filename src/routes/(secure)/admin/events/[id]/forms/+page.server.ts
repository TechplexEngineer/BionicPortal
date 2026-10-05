import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
	const [event] = await locals.db.select().from(table.events).where(eq(table.events.id, params.id));
	if (!event) throw redirect(302, "/admin/events");
	const allForms = await locals.db.select().from(table.eventForms);
	const forms = allForms.filter((eventForm) => eventForm.eventId === params.id);
	const events = await locals.db.select().from(table.events);

	return {
		event: { id: event.id, ...event.data },
		forms,
		sourceEvents: events
			.filter((sourceEvent) => sourceEvent.id !== params.id)
			.map((sourceEvent) => ({
				id: sourceEvent.id,
				...sourceEvent.data,
				forms: allForms.filter((sourceForm) => sourceForm.eventId === sourceEvent.id)
			}))
	};
};

export const actions: Actions = {
	copy: async ({ request, locals, platform, params }) => {
		const formData = await request.formData();
		const sourceFormId = formData.get("sourceFormId")?.toString().trim();
		if (!sourceFormId) return fail(400, { message: "Choose a form to copy." });

		const [sourceForm] = await locals.db
			.select()
			.from(table.eventForms)
			.where(eq(table.eventForms.id, sourceFormId));
		if (!sourceForm || sourceForm.eventId === params.id) {
			return fail(404, { message: "Source form not found." });
		}

		const bucket = platform?.env.FORMS_BUCKET;
		if (!bucket) {
			console.error("Failed to copy event form: Forms storage is not configured");
			return fail(500, { message: "Unable to copy the form." });
		}

		try {
			const sourcePdf = await bucket.get(sourceForm.basePdfKey);
			if (!sourcePdf) throw new Error("Source form PDF not found");

			const formId = crypto.randomUUID();
			const pdfKey = `events/${params.id}/forms/${formId}/base.pdf`;
			await bucket.put(pdfKey, await sourcePdf.arrayBuffer(), {
				httpMetadata: { contentType: "application/pdf" }
			});
			await locals.db.insert(table.eventForms).values({
				id: formId,
				eventId: params.id,
				name: sourceForm.name,
				basePdfKey: pdfKey,
				definition: sourceForm.definition
			});
		} catch (error) {
			console.error("Failed to copy event form:", error);
			return fail(500, { message: "Unable to copy the form." });
		}

		return { success: true, message: `Copied ${sourceForm.name}.` };
	}
};
