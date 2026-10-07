import { error, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { FormDefinition } from "@team4909/bionic-sign";
import { getAgeOnDate, getFormStatus } from "$lib/server/formWorkflow";
import * as table from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

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
	const today = new Date();
	return {
		form,
		assignments: students
			.filter((student) => !student.hidden)
			.map((student) => {
				const assignment = assignments.find((item) => item.studentId === student.userid);
				const status = assignment?.studentSubmittedAt
					? getFormStatus({
							definition: form.definition as FormDefinition,
							studentValues: assignment.studentValues as never,
							parentValues: assignment.parentValues as never,
							under18:
								assignment.parentRequired ??
								(!student?.dateOfBirth || getAgeOnDate(student.dateOfBirth, today) < 18)
						})
					: "student-incomplete";
				return {
					id: assignment?.id,
					studentId: student.userid,
					studentName: `${student.firstName} ${student.lastName}`,
					status,
					studentSubmittedAt: assignment?.studentSubmittedAt,
					signedPdfKey: assignment?.signedPdfKey
				};
			})
			.sort((a, b) => a.studentName.localeCompare(b.studentName))
	};
};
