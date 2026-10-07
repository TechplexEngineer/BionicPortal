import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, platform, params }) => {
	const [row] = await locals.db
		.select({ key: table.standaloneForms.basePdfKey })
		.from(table.standaloneFormAssignments)
		.innerJoin(
			table.standaloneForms,
			eq(table.standaloneFormAssignments.formId, table.standaloneForms.id)
		)
		.where(
			and(
				eq(table.standaloneFormAssignments.id, params.assignmentId),
				eq(table.standaloneFormAssignments.studentId, locals.user!.username)
			)
		);
	if (!row) throw error(404, "Form assignment not found");
	const object = await platform?.env.FORMS_BUCKET.get(row.key);
	if (!object) throw error(404, "Base PDF not found");
	return new Response(object.body, {
		headers: { "content-type": "application/pdf", "cache-control": "private, no-store" }
	});
};
