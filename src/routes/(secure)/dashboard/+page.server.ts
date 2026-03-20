import type { PageServerLoad } from "./$types";
import { eq, inArray } from "drizzle-orm";
import * as table from "$lib/server/db/schema";

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const db = locals.db;
	const role = user.role;

	if (role === "parent") {
		// Load parent-specific data
		const links = await db
			.select()
			.from(table.parentStudentLinks)
			.where(eq(table.parentStudentLinks.parentId, user.id));

		const studentIds = links.map((l) => l.studentId);

		const studentsWithRegs: {
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
		}[] = [];

		if (studentIds.length > 0) {
			// Batch-fetch all linked students in one query
			const allStudents = await db
				.select()
				.from(table.students)
				.where(inArray(table.students.userid, studentIds));

			// Batch-fetch all registrations for all linked students in one query
			const allRegs = await db
				.select({
					id: table.eventRegistrations.id,
					paid: table.eventRegistrations.paid,
					formCompleted: table.eventRegistrations.formCompleted,
					studentId: table.eventRegistrations.studentId,
					eventId: table.events.id,
					eventData: table.events.data
				})
				.from(table.eventRegistrations)
				.innerJoin(table.events, eq(table.eventRegistrations.eventId, table.events.id))
				.where(inArray(table.eventRegistrations.studentId, studentIds));

			for (const student of allStudents) {
				const regs = allRegs.filter((r) => r.studentId === student.userid);
				studentsWithRegs.push({
					student,
					registrations: regs.map((r) => {
						const eventData = r.eventData as table.EventData;
						return {
							id: r.id,
							paid: r.paid,
							formCompleted: r.formCompleted,
							eventId: r.eventId,
							eventName: eventData.name,
							startDate: eventData.startDate,
							endDate: eventData.endDate,
							cost: eventData.cost
						};
					})
				});
			}
		}

		return {
			role,
			student: null as typeof table.students.$inferSelect | null,
			upcomingRegistrations: [] as {
				id: string;
				paid: boolean;
				formCompleted: boolean;
				invoicePaymentLink: string | null;
				eventId: string;
				eventName: string;
				startDate: string;
				endDate: string;
				cost: number;
				permissionFormUrl: string | undefined;
			}[],
			actionItems: [] as {
				id: string;
				paid: boolean;
				formCompleted: boolean;
				invoicePaymentLink: string | null;
				eventId: string;
				eventName: string;
				startDate: string;
				endDate: string;
				cost: number;
				permissionFormUrl: string | undefined;
			}[],
			studentsWithRegs
		};
	}

	// Student dashboard
	const [student] = await db
		.select()
		.from(table.students)
		.where(eq(table.students.userid, user.username));

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

	const now = new Date();
	const upcomingRegistrations = registrations
		.map((r) => ({
			id: r.id,
			paid: r.paid,
			formCompleted: r.formCompleted,
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
		student: student ?? null,
		upcomingRegistrations,
		actionItems,
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
