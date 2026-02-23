import { fail, redirect } from "@sveltejs/kit";
import { eq, and, sql } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.db;
	const user = locals.user!;

	// Fetch all events
	const allEvents = await db.select().from(table.events);

	// Fetch current user's registrations
	const registrations = await db.select()
		.from(table.eventRegistrations)
		.where(eq(table.eventRegistrations.studentId, user.username)); // Assuming username is the student email/userid

	const registeredEventIds = new Set(registrations.map(r => r.eventId));

	const now = new Date();

	// Filter and format events
	const events = allEvents.map(e => ({
		id: e.id,
		...e.data,
		isRegistered: registeredEventIds.has(e.id),
		isPastDeadline: e.data.registrationDueDate ? new Date(e.data.registrationDueDate) < now : false
	}))
		.filter(e => !e.isPastDeadline || e.isRegistered) // Show if not past deadline OR if already registered
		.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

	return {
		events
	};
};

export const actions: Actions = {
	register: async ({ request, locals }) => {
		const formData = await request.formData();
		const eventId = formData.get("eventId") as string;
		const user = locals.user!;
		const db = locals.db;

		if (!eventId) {
			return fail(400, { message: "Missing event ID" });
		}

		// 1. Verify event exists and registration is still open
		const [eventData] = await db.select().from(table.events).where(eq(table.events.id, eventId));
		if (!eventData) {
			return fail(404, { message: "Event not found" });
		}

		const now = new Date();
		if (eventData.data.registrationDueDate && new Date(eventData.data.registrationDueDate) < now) {
			return fail(400, { message: "Registration for this event has closed" });
		}

		// 2. Check if already registered
		const [existing] = await db.select()
			.from(table.eventRegistrations)
			.where(and(
				eq(table.eventRegistrations.eventId, eventId),
				eq(table.eventRegistrations.studentId, user.username)
			));

		if (existing) {
			return fail(400, { message: "You are already registered for this event" });
		}

		// 3. Register
		try {
			await db.insert(table.eventRegistrations).values({
				id: crypto.randomUUID(),
				eventId,
				studentId: user.username,
				paid: false,
				formCompleted: false
			});
		} catch (e) {
			console.error("Failed to register:", e);
			return fail(500, { message: "Failed to register" });
		}

		return { success: true };
	}
};
