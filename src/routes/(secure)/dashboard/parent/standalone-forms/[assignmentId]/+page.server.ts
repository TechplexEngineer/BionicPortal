import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { exportFlattenedPdf, validateDefinition } from "@team4909/bionic-sign";
import { getOwnedFields, hasRequiredValues, validateOwnedValues } from "$lib/server/formWorkflow";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

async function getAuthorizedAssignment(
	db: App.Locals["db"],
	parentId: string,
	assignmentId: string
) {
	const [row] = await db
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
				eq(table.parentStudentLinks.parentId, parentId)
			)
		)
		.where(eq(table.standaloneFormAssignments.id, assignmentId));
	if (row && row.form.status !== "assigned") return null;
	if (!row || !row.assignment.studentSubmittedAt || !row.assignment.parentRequired) return null;
	const definition = validateDefinition(row.form.definition);
	if (!getOwnedFields(definition, "parent").some((field) => field.required)) return null;
	return { ...row, definition };
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const row = await getAuthorizedAssignment(locals.db, locals.user!.id, params.assignmentId);
	if (!row) throw error(404, "Form not found");
	return {
		form: { id: row.form.id, name: row.form.name },
		assignmentId: row.assignment.id,
		student: { firstName: row.student.firstName, lastName: row.student.lastName },
		definition: { version: 1 as const, fields: getOwnedFields(row.definition, "parent") },
		completed: Boolean(row.assignment.parentCompletedAt)
	};
};

export const actions: Actions = {
	submit: async ({ locals, params, request, platform }) => {
		const row = await getAuthorizedAssignment(locals.db, locals.user!.id, params.assignmentId);
		if (!row) throw error(404, "Form not found");
		if (row.assignment.parentCompletedAt) return { success: true };
		let values;
		try {
			const raw = (await request.formData()).get("values");
			if (typeof raw !== "string") throw new Error("Missing values");
			values = validateOwnedValues(row.definition, JSON.parse(raw), "parent");
			if (!hasRequiredValues(row.definition, values, "parent"))
				throw new Error("Missing required parent fields");
		} catch {
			return { status: 400, message: "Please complete all required parent fields." };
		}
		const bucket = platform?.env.FORMS_BUCKET;
		if (!bucket) {
			console.error("Unable to submit standalone parent form: Forms storage is not configured");
			throw error(503, "Form storage is unavailable");
		}
		const base = await bucket.get(row.form.basePdfKey);
		if (!base) throw error(404, "Base PDF not found");
		const combined = { ...((row.assignment.studentValues ?? {}) as object), ...values };
		const pdf = await exportFlattenedPdf(
			new Uint8Array(await base.arrayBuffer()),
			row.definition,
			combined
		);
		const signedPdfKey = `standalone-forms/${row.form.id}/signed/${row.assignment.id}.pdf`;
		await bucket.put(signedPdfKey, pdf, { httpMetadata: { contentType: "application/pdf" } });
		await locals.db
			.update(table.standaloneFormAssignments)
			.set({ parentValues: values, parentCompletedAt: new Date(), signedPdfKey })
			.where(eq(table.standaloneFormAssignments.id, row.assignment.id));
		return { success: true };
	}
};
