import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { exportFlattenedPdf, validateDefinition } from "@team4909/bionic-sign";
import { getOwnedFields } from "$lib/server/formWorkflow";
import * as table from "$lib/server/db/schema";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, platform, params }) => {
	const [row] = await locals.db
		.select({
			assignment: table.standaloneFormAssignments,
			form: table.standaloneForms,
			student: table.students
		})
		.from(table.standaloneFormAssignments)
		.innerJoin(
			table.standaloneForms,
			eq(table.standaloneFormAssignments.formId, table.standaloneForms.id)
		)
		.innerJoin(table.students, eq(table.standaloneFormAssignments.studentId, table.students.userid))
		.innerJoin(
			table.parentStudentLinks,
			and(
				eq(table.parentStudentLinks.studentId, table.students.userid),
				eq(table.parentStudentLinks.parentId, locals.user!.id)
			)
		)
		.where(
			and(
				eq(table.standaloneFormAssignments.id, params.assignmentId),
				eq(table.standaloneForms.status, "assigned")
			)
		);
	if (!row || !row.assignment.studentSubmittedAt || !row.assignment.parentRequired)
		throw error(404, "Form not found");
	const definition = validateDefinition(row.form.definition);
	if (!getOwnedFields(definition, "parent").some((field) => field.required))
		throw error(404, "Form not found");
	const object = await platform?.env.FORMS_BUCKET.get(row.form.basePdfKey);
	if (!object) throw error(404, "Base PDF not found");
	const pdf = await exportFlattenedPdf(
		new Uint8Array(await object.arrayBuffer()),
		{ version: 1, fields: getOwnedFields(definition, "student") },
		(row.assignment.studentValues ?? {}) as Record<string, never>
	);
	return new Response(pdf as unknown as BodyInit, {
		headers: { "content-type": "application/pdf", "cache-control": "private, no-store" }
	});
};
