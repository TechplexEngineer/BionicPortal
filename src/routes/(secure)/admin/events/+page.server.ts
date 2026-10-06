import type { PageServerLoad, Actions } from "./$types";
import { getDb } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { sortEventsByStartDate } from "$lib/server/eventSorting";
import { eq, sql } from "drizzle-orm";
import { fail } from "@sveltejs/kit";

export const load = (async ({ platform }) => {
	const db = getDb(platform);
	const [events, formCounts] = await Promise.all([
		db.select().from(table.events),
		db
			.select({
				eventId: table.eventForms.eventId,
				count: sql<number>`count(*)`
			})
			.from(table.eventForms)
			.groupBy(table.eventForms.eventId)
	]);
	const formCountByEvent = new Map(formCounts.map(({ eventId, count }) => [eventId, count]));

	return {
		events: sortEventsByStartDate(events, (event) => event.data.startDate).map((e) => ({
			id: e.id,
			...e.data,
			formCount: formCountByEvent.get(e.id) ?? 0
		}))
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	delete: async ({ request, platform }) => {
		const formData = await request.formData();
		const id = formData.get("id");

		if (typeof id !== "string") {
			return fail(400, { message: "Invalid ID" });
		}

		const db = getDb(platform);
		await db.delete(table.events).where(eq(table.events.id, id));

		return { success: true };
	}
};
