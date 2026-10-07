import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, params, platform }) => {
	if (locals.user?.role !== "admin") throw error(403, "Forbidden");
	const [assignment] = await locals.db
		.select({ signedPdfKey: table.standaloneFormAssignments.signedPdfKey })
		.from(table.standaloneFormAssignments)
		.where(
			and(
				eq(table.standaloneFormAssignments.id, params.assignmentId),
				eq(table.standaloneFormAssignments.formId, params.formId)
			)
		);
	if (!assignment?.signedPdfKey) throw error(404, "Signed PDF not found");
	const object = await platform?.env.FORMS_BUCKET.get(assignment.signedPdfKey);
	if (!object) throw error(404, "Signed PDF not found");
	return new Response(object.body, {
		headers: {
			"content-type": "application/pdf",
			"content-disposition": `attachment; filename="signed-form-${params.assignmentId}.pdf"`,
			"cache-control": "private, no-store"
		}
	});
};
