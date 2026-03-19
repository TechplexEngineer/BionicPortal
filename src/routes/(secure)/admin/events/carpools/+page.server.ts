import { fail, redirect } from "@sveltejs/kit";
import { eq, and, sql } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	const db = event.locals.db;

	const events = await db.select().from(table.events);
	const sortedEvents = events.sort(
		(a, b) => new Date(a.data.startDate).getTime() - new Date(b.data.startDate).getTime()
	);

	const mentors = await db
		.select({
			id: table.user.id,
			username: table.user.username
		})
		.from(table.user);

	const carpoolSpots = await db.select().from(table.carpoolSpots);

	return {
		events: sortedEvents.map((e) => ({ id: e.id, ...e.data })),
		mentors,
		carpoolSpots
	};
};

export const actions: Actions = {
	saveSpot: async ({ request, locals }) => {
		const formData = await request.formData();
		const eventId = formData.get("eventId") as string;
		const mentorId = formData.get("mentorId") as string;
		const capacityStr = formData.get("capacity") as string;

		const db = locals.db;

		if (!capacityStr || capacityStr.trim() === "") {
			await db
				.delete(table.carpoolSpots)
				.where(and(eq(table.carpoolSpots.eventId, eventId), eq(table.carpoolSpots.mentorId, mentorId)));
			return { success: true };
		}

		const capacity = parseInt(capacityStr);
		if (isNaN(capacity) || capacity < 0) {
			return fail(400, { message: "Invalid capacity" });
		}

		// Get mentor name for default driver name
		const [mentor] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.id, mentorId))
			.limit(1);

		const driverName = mentor?.username || "Unknown";

		await db
			.insert(table.carpoolSpots)
			.values({
				id: crypto.randomUUID(),
				eventId,
				mentorId,
				capacity,
				driverName
			})
			.onConflictDoUpdate({
				target: [table.carpoolSpots.eventId, table.carpoolSpots.mentorId],
				set: { capacity }
			});

		return { success: true };
	}
};
