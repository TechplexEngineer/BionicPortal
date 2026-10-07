import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import type { FormDefinition } from "@team4909/bionic-sign";
import { eq, inArray } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { getAgeOnDate, getFormStatus } from "$lib/server/formWorkflow";
import { getProfileCompleteness } from "$lib/server/profileCompleteness";
import type { Role } from "$lib/roles";
import { getStandaloneAssignmentStatus } from "./standaloneFormStatus";

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const db = locals.db;
	const role = user.role;

	if (role === "parent") return redirect(302, "/dashboard/parent");

	// Student dashboard
	const profile =
		role === "mentor" || role === "admin"
			? ((
					await db
						.select()
						.from(table.mentorProfiles)
						.where(eq(table.mentorProfiles.userId, user.id))
				)[0] ?? null)
			: ((
					await db.select().from(table.students).where(eq(table.students.userid, user.username))
				)[0] ?? null);
	const profileCompleteness = getProfileCompleteness(role as Role, profile);
	const [student] = await db
		.select()
		.from(table.students)
		.where(eq(table.students.userid, user.username));

	const standaloneRows = await db
		.select({ assignment: table.standaloneFormAssignments, form: table.standaloneForms })
		.from(table.standaloneFormAssignments)
		.innerJoin(
			table.standaloneForms,
			eq(table.standaloneFormAssignments.formId, table.standaloneForms.id)
		)
		.where(eq(table.standaloneFormAssignments.studentId, user.username));
	const assignedForms = standaloneRows.map(({ assignment, form }) =>
		getStandaloneAssignmentStatus(
			assignment.id,
			form.name,
			form.definition,
			assignment.studentSubmittedAt,
			assignment.parentCompletedAt,
			assignment.parentRequired,
			student?.dateOfBirth ?? null
		)
	);

	const registrations = await db
		.select({
			id: table.eventRegistrations.id,
			paid: table.eventRegistrations.paid,
			formCompleted: table.eventRegistrations.formCompleted,
			invoicePaymentLink: table.eventRegistrations.invoicePaymentLink,
			eventId: table.events.id,
			eventData: table.events.data
		})
		.from(table.eventRegistrations)
		.innerJoin(table.events, eq(table.eventRegistrations.eventId, table.events.id))
		.where(eq(table.eventRegistrations.studentId, user.username));
	const eventForms = await db.select().from(table.eventForms);
	const completedForms = registrations.length
		? await db
				.select({
					registrationId: table.eventFormSubmissions.registrationId,
					eventFormId: table.eventFormSubmissions.eventFormId,
					studentValues: table.eventFormSubmissions.studentValues,
					parentValues: table.eventFormSubmissions.parentValues,
					studentCompleted: table.eventFormSubmissions.studentCompleted,
					parentCompleted: table.eventFormSubmissions.parentCompleted
				})
				.from(table.eventFormSubmissions)
				.where(
					inArray(
						table.eventFormSubmissions.registrationId,
						registrations.map((registration) => registration.id)
					)
				)
		: [];

	const now = new Date();
	const upcomingRegistrations = registrations
		.map((r) => ({
			id: r.id,
			paid: r.paid,
			formCompleted:
				eventForms.filter((eventForm) => eventForm.eventId === r.eventId).length > 0
					? eventForms
							.filter((eventForm) => eventForm.eventId === r.eventId)
							.every((eventForm) => {
								const submission = completedForms.find(
									(item) => item.registrationId === r.id && item.eventFormId === eventForm.id
								);
								return Boolean(
									submission &&
									getFormStatus({
										definition: eventForm.definition as unknown as FormDefinition,
										studentValues: submission.studentValues as never,
										parentValues: submission.parentValues as never,
										under18: Boolean(
											student?.dateOfBirth &&
											getAgeOnDate(student.dateOfBirth, new Date(r.eventData.startDate)) < 18
										)
									}) === "complete"
								);
							})
					: r.formCompleted,
			forms: eventForms
				.filter((eventForm) => eventForm.eventId === r.eventId)
				.map((eventForm) => ({
					id: eventForm.id,
					name: eventForm.name,
					completed: (() => {
						const submission = completedForms.find(
							(item) => item.registrationId === r.id && item.eventFormId === eventForm.id
						);
						return Boolean(
							submission &&
							getFormStatus({
								definition: eventForm.definition as unknown as FormDefinition,
								studentValues: submission.studentValues as never,
								parentValues: submission.parentValues as never,
								under18: Boolean(
									student?.dateOfBirth &&
									getAgeOnDate(student.dateOfBirth, new Date(r.eventData.startDate)) < 18
								)
							}) === "complete"
						);
					})()
				})),
			invoicePaymentLink: r.invoicePaymentLink,
			eventId: r.eventId,
			eventName: (r.eventData as table.EventData).name,
			startDate: (r.eventData as table.EventData).startDate,
			endDate: (r.eventData as table.EventData).endDate,
			cost: (r.eventData as table.EventData).cost,
			permissionFormUrl: (r.eventData as table.EventData).permissionFormUrl
		}))
		.filter((r) => new Date(r.endDate) >= now)
		.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

	const actionItems = upcomingRegistrations.filter((r) => !r.paid || !r.formCompleted);

	return {
		role,
		profileCompleteness,
		student: student ?? null,
		upcomingRegistrations,
		actionItems,
		assignedForms,
		studentsWithRegs: [] as {
			student: typeof table.students.$inferSelect;
			registrations: {
				id: string;
				paid: boolean;
				formCompleted: boolean;
				eventId: string;
				eventName: string;
				startDate: string;
				endDate: string;
				cost: number;
			}[];
		}[]
	};
};
