import { error, fail, redirect } from "@sveltejs/kit";
import { and, eq, isNull } from "drizzle-orm";
import type { FormDefinition } from "@team4909/bionic-sign";
import { getAgeOnDate, getFormStatus } from "$lib/server/formWorkflow";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
	if (locals.user?.role !== "admin") throw error(403, "Forbidden");
	const [form] = await locals.db
		.select()
		.from(table.standaloneForms)
		.where(eq(table.standaloneForms.id, params.formId));
	if (!form) throw redirect(302, "/admin/forms");
	const [students, assignments] = await Promise.all([
		locals.db.select().from(table.students),
		locals.db
			.select()
			.from(table.standaloneFormAssignments)
			.where(eq(table.standaloneFormAssignments.formId, params.formId))
	]);
	const studentById = new Map(students.map((student) => [student.userid, student]));
	const today = new Date();
	return {
		form,
		availableStudents: students
			.filter(
				(student) =>
					!student.hidden &&
					!assignments.some((assignment) => assignment.studentId === student.userid)
			)
			.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
			.map((student) => ({ id: student.userid, name: `${student.firstName} ${student.lastName}` })),
		assignments: assignments
			.map((assignment) => {
				const student = studentById.get(assignment.studentId);
				const status = assignment.studentSubmittedAt
					? getFormStatus({
							definition: form.definition as FormDefinition,
							studentValues: assignment.studentValues as never,
							parentValues: assignment.parentValues as never,
							under18: assignment.parentRequired ?? (!student?.dateOfBirth || getAgeOnDate(student.dateOfBirth, today) < 18)
						})
					: "student-incomplete";
				return {
					id: assignment.id,
					studentId: assignment.studentId,
					studentName: student ? `${student.firstName} ${student.lastName}` : assignment.studentId,
					status,
					studentSubmittedAt: assignment.studentSubmittedAt,
					signedPdfKey: assignment.signedPdfKey
				};
			})
			.sort((a, b) => a.studentName.localeCompare(b.studentName))
	};
};

export const actions: Actions = {
	assign: async ({ request, locals, params }) => {
		if (locals.user?.role !== "admin") return fail(403, { message: "Forbidden." });
		const studentId = (await request.formData()).get("studentId")?.toString();
		if (!studentId) return fail(400, { message: "Choose a student." });
		const [[form], [student]] = await Promise.all([
			locals.db
				.select({ id: table.standaloneForms.id })
				.from(table.standaloneForms)
				.where(eq(table.standaloneForms.id, params.formId)),
			locals.db
				.select({ userid: table.students.userid })
				.from(table.students)
				.where(and(eq(table.students.userid, studentId), eq(table.students.hidden, false)))
		]);
		if (!form || !student) return fail(404, { message: "Form or student not found." });
		await locals.db
			.insert(table.standaloneFormAssignments)
			.values({ id: crypto.randomUUID(), formId: form.id, studentId })
			.onConflictDoNothing();
		return { success: true, message: "Form assigned." };
	},
	unassign: async ({ request, locals, params }) => {
		if (locals.user?.role !== "admin") return fail(403, { message: "Forbidden." });
		const assignmentId = (await request.formData()).get("assignmentId")?.toString();
		if (!assignmentId) return fail(400, { message: "Invalid assignment." });
		const [assignment] = await locals.db
			.select()
			.from(table.standaloneFormAssignments)
			.where(
				and(
					eq(table.standaloneFormAssignments.id, assignmentId),
					eq(table.standaloneFormAssignments.formId, params.formId)
				)
			);
		if (!assignment) return fail(404, { message: "Assignment not found." });
		if (
			assignment.studentSubmittedAt ||
			assignment.parentCompletedAt ||
			assignment.signedPdfKey ||
			Object.keys(assignment.studentValues as object).length ||
			Object.keys(assignment.parentValues as object).length
		)
			return fail(409, {
				message: "This form has student or parent work and cannot be unassigned."
			});
		await locals.db
			.delete(table.standaloneFormAssignments)
			.where(
				and(
					eq(table.standaloneFormAssignments.id, assignmentId),
					eq(table.standaloneFormAssignments.formId, params.formId),
					isNull(table.standaloneFormAssignments.studentSubmittedAt)
				)
			);
		return { success: true, message: "Assignment removed." };
	}
};
