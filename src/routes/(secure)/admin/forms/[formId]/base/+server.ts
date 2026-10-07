import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, platform, params }) => {
	if (locals.user?.role !== "admin") throw error(403, "Forbidden");
	const [form] = await locals.db
		.select({ basePdfKey: table.standaloneForms.basePdfKey })
		.from(table.standaloneForms)
		.where(eq(table.standaloneForms.id, params.formId));
	if (!form) throw error(404, "Form not found");
	const object = await platform?.env.FORMS_BUCKET.get(form.basePdfKey);
	if (!object) throw error(404, "Base PDF not found");
	return new Response(object.body, {
		headers: { "content-type": "application/pdf", "cache-control": "private, no-store" }
	});
};
