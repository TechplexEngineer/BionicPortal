import { fail, redirect } from "@sveltejs/kit";
import * as table from "$lib/server/db/schema";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		if (locals.user?.role !== "admin") return fail(403, { message: "Forbidden." });
		const formData = await request.formData();
		const name = formData.get("name")?.toString().trim();
		const pdf = formData.get("pdf");
		if (!name || !(pdf instanceof File) || pdf.size === 0)
			return fail(400, { message: "A form name and PDF are required." });
		if (pdf.type && pdf.type !== "application/pdf")
			return fail(400, { message: "The base document must be a PDF." });
		const bucket = platform?.env.FORMS_BUCKET;
		if (!bucket) return fail(503, { message: "Form storage is unavailable." });
		const formId = crypto.randomUUID();
		const pdfKey = `standalone-forms/${formId}/base.pdf`;
		try {
			await bucket.put(pdfKey, await pdf.arrayBuffer(), {
				httpMetadata: { contentType: "application/pdf" }
			});
			await locals.db.insert(table.standaloneForms).values({
				id: formId,
				name,
				basePdfKey: pdfKey,
				definition: { version: 1, fields: [] }
			});
		} catch (error) {
			console.error("Failed to create standalone form:", error);
			try {
				await bucket.delete(pdfKey);
			} catch (cleanupError) {
				console.error("Failed to remove orphaned form PDF:", pdfKey, cleanupError);
			}
			return fail(500, { message: "Unable to create the form." });
		}
		throw redirect(303, `/admin/forms/${formId}/edit`);
	}
};
