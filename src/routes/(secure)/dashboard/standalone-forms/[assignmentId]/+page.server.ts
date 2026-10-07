import { error, fail } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { exportFlattenedPdf, validateDefinition, type FormValues } from "@team4909/bionic-sign";
import {
	getAgeOnDate,
	getOwnedFields,
	hasRequiredValues,
	validateOwnedValues
} from "$lib/server/formWorkflow";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

async function getAssignment(db: App.Locals["db"], studentId: string, assignmentId: string) {
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
		.where(
			and(
				eq(table.standaloneFormAssignments.id, assignmentId),
				eq(table.standaloneFormAssignments.studentId, studentId),
				eq(table.standaloneForms.status, "assigned")
			)
		);
	return row;
}

function needsParent(
	definition: ReturnType<typeof validateDefinition>,
	dateOfBirth: string | null,
	date = new Date()
) {
	return (
		getOwnedFields(definition, "parent").some((field) => field.required) &&
		(!dateOfBirth || getAgeOnDate(dateOfBirth, date) < 18)
	);
}

function parseValues(formData: FormData) {
	const raw = formData.get("values");
	if (typeof raw !== "string") throw new Error("Form values are required.");
	const values: unknown = JSON.parse(raw);
	if (!values || typeof values !== "object" || Array.isArray(values))
		throw new Error("Form values are invalid.");
	return values as FormValues;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const row = await getAssignment(locals.db, locals.user!.username, params.assignmentId);
	if (!row) throw error(404, "Form assignment not found");
	const definition = validateDefinition(row.form.definition);
	const parentRequired =
		row.assignment.studentSubmittedAt && row.assignment.parentRequired !== null
			? row.assignment.parentRequired
			: needsParent(definition, row.student.dateOfBirth);
	return {
		assignmentId: row.assignment.id,
		form: row.form,
		definition: { version: 1 as const, fields: getOwnedFields(definition, "student") },
		studentValues: row.assignment.studentValues as FormValues,
		studentSubmitted: Boolean(row.assignment.studentSubmittedAt),
		parentRequired,
		parentCompleted: Boolean(row.assignment.parentCompletedAt)
	};
};

async function saveValues(
	{ request, locals, params, platform }: Parameters<Actions["submit"]>[0],
	submit: boolean
) {
	const row = await getAssignment(locals.db, locals.user!.username, params.assignmentId);
	if (!row) return fail(404, { message: "Form assignment not found." });
	if (row.assignment.studentSubmittedAt)
		return fail(409, { message: "This form has already been submitted." });
	try {
		const definition = validateDefinition(row.form.definition);
		const values = validateOwnedValues(
			definition,
			parseValues(await request.formData()),
			"student"
		);
		const studentValues = { ...(row.assignment.studentValues as FormValues), ...values };
		if (submit && !hasRequiredValues(definition, studentValues, "student")) {
			return fail(400, { message: "Complete all required student fields before submitting." });
		}
		if (!submit) {
			await locals.db
				.update(table.standaloneFormAssignments)
				.set({ studentValues })
				.where(eq(table.standaloneFormAssignments.id, row.assignment.id));
			return { success: true, message: "Draft saved." };
		}
		const submittedAt = new Date();
		const parentRequired = needsParent(definition, row.student.dateOfBirth, submittedAt);
		let signedPdfKey: string | null = null;
		if (!parentRequired) {
			const bucket = platform?.env.FORMS_BUCKET;
			if (!bucket) return fail(503, { message: "Forms storage is unavailable." });
			const object = await bucket.get(row.form.basePdfKey);
			if (!object) return fail(404, { message: "Base PDF not found." });
			const pdf = await exportFlattenedPdf(
				new Uint8Array(await object.arrayBuffer()),
				{ version: 1, fields: getOwnedFields(definition, "student") },
				studentValues
			);
			signedPdfKey = `forms/${row.form.id}/signed/${row.assignment.id}.pdf`;
			await bucket.put(signedPdfKey, pdf, { httpMetadata: { contentType: "application/pdf" } });
		}
		await locals.db
			.update(table.standaloneFormAssignments)
			.set({ studentValues, studentSubmittedAt: submittedAt, parentRequired, signedPdfKey })
			.where(eq(table.standaloneFormAssignments.id, row.assignment.id));
		return {
			success: true,
			message: parentRequired
				? "Student portion submitted. A parent must complete their portion."
				: "Form submitted."
		};
	} catch (caught) {
		return fail(400, {
			message: caught instanceof Error ? caught.message : "Unable to save form."
		});
	}
}

export const actions: Actions = {
	saveDraft: (event) => saveValues(event, false),
	submit: (event) => saveValues(event, true)
};
