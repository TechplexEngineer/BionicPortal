import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const eventList = await locals.db.query.events.findMany({
		orderBy: (events, { asc }) => [asc(events.dateStr)]
	});
	return { events: eventList };
};
