import * as table from "$lib/server/db/schema";
import { getProfileCompleteness } from "$lib/server/profileCompleteness";
import { sortEventsByStartDate } from "$lib/server/eventSorting";
import type { PageServerLoad } from "./$types";

export const load = (async ({ locals }) => {
	const [events, registrations, students] = await Promise.all([
		locals.db.select().from(table.events),
		locals.db.select().from(table.eventRegistrations),
		locals.db.select().from(table.students)
	]);

	const registrationCounts = new Map<string, number>();
	for (const registration of registrations) {
		registrationCounts.set(
			registration.eventId,
			(registrationCounts.get(registration.eventId) ?? 0) + 1
		);
	}

	const activeStudents = students.filter((student) => !student.hidden);
	const profileComplete = activeStudents.filter(
		(student) => !getProfileCompleteness("user", student).incomplete
	).length;

	return {
		events: sortEventsByStartDate(events, (event) => event.data.startDate).map((event) => ({
			id: event.id,
			...event.data,
			registrationCount: registrationCounts.get(event.id) ?? 0
		})),
		studentOverview: {
			total: activeStudents.length,
			profileComplete,
			profilePercent:
				activeStudents.length === 0
					? 0
					: Math.round((profileComplete / activeStudents.length) * 100)
		}
	};
}) satisfies PageServerLoad;
