import { and, eq, inArray } from "drizzle-orm";
import { validateDefinition } from "@team4909/bionic-sign";
import * as table from "$lib/server/db/schema";
import { getOwnedFields } from "$lib/server/formWorkflow";
import type { PageServerLoad } from "./$types";
import { getProfileCompleteness } from "$lib/server/profileCompleteness";

export const load: PageServerLoad = async ({ locals }) => {
	const [profile] = await locals.db
		.select()
		.from(table.parentProfiles)
		.where(eq(table.parentProfiles.userId, locals.user!.id));
	const profileCompleteness = getProfileCompleteness("parent", profile ?? null);
	const links = await locals.db
		.select()
		.from(table.parentStudentLinks)
		.where(eq(table.parentStudentLinks.parentId, locals.user!.id));
	const studentIds = links.map((link) => link.studentId);
	if (studentIds.length === 0)
		return { tasks: [], standaloneTasks: [], linkedStudents: [], profileCompleteness };
	const rows = await locals.db
		.select({
			submission: table.eventFormSubmissions,
			invite: table.parentFormInvites,
			form: table.eventForms,
			event: table.events,
			student: table.students
		})
		.from(table.eventFormSubmissions)
		.innerJoin(
			table.parentFormInvites,
			eq(table.parentFormInvites.submissionId, table.eventFormSubmissions.id)
		)
		.innerJoin(table.eventForms, eq(table.eventFormSubmissions.eventFormId, table.eventForms.id))
		.innerJoin(
			table.eventRegistrations,
			eq(table.eventFormSubmissions.registrationId, table.eventRegistrations.id)
		)
		.innerJoin(table.events, eq(table.eventRegistrations.eventId, table.events.id))
		.innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
		.where(inArray(table.students.userid, studentIds));
	const tasks = rows
		.filter(({ submission, form, student, event }) => {
			if (submission.parentCompleted || !submission.studentCompleted) return false;
			const definition = validateDefinition(form.definition);
			return (
				getOwnedFields(definition, "parent").some((field) => field.required) &&
				Boolean(student.dateOfBirth) &&
				new Date(event.data.startDate) >= new Date()
			);
		})
		.map(({ submission, invite, form, event, student }) => ({
			inviteId: invite.id,
			formId: form.id,
			formName: form.name,
			eventName: event.data.name,
			studentName: `${student.firstName} ${student.lastName}`,
			studentId: student.userid
		}));
	const standaloneRows = await locals.db
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
				inArray(table.standaloneFormAssignments.studentId, studentIds),
				eq(table.standaloneForms.status, "assigned")
			)
		);
	const standaloneTasks = standaloneRows
		.filter(({ assignment }) =>
			Boolean(
				assignment.studentSubmittedAt && assignment.parentRequired && !assignment.parentCompletedAt
			)
		)
		.map(({ assignment, form, student }) => ({
			assignmentId: assignment.id,
			formName: form.name,
			studentName: `${student.firstName} ${student.lastName}`
		}));
	return { tasks, standaloneTasks, linkedStudents: studentIds, profileCompleteness };
};
