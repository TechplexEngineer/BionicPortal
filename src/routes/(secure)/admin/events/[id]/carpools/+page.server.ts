import { fail, redirect } from "@sveltejs/kit";
import { eq, and, inArray } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    const db = event.locals.db;
    const eventId = event.params.id;

    const [eventData] = await db.select().from(table.events).where(eq(table.events.id, eventId));

    if (!eventData) {
        return redirect(302, "/admin/events");
    }

    const registrations = await db
        .select({
            id: table.eventRegistrations.id,
            student: {
                userid: table.students.userid,
                firstName: table.students.firstName,
                lastName: table.students.lastName
            }
        })
        .from(table.eventRegistrations)
        .innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
        .where(eq(table.eventRegistrations.eventId, eventId));

    const carpoolSpots = await db
        .select({
            id: table.carpoolSpots.id,
            capacity: table.carpoolSpots.capacity,
            driverName: table.carpoolSpots.driverName,
            mentor: {
                id: table.user.id,
                username: table.user.username
            }
        })
        .from(table.carpoolSpots)
        .innerJoin(table.user, eq(table.carpoolSpots.mentorId, table.user.id))
        .where(eq(table.carpoolSpots.eventId, eventId));

    const spotIds = carpoolSpots.map((s) => s.id);

    let eventAssignments: any[] = [];
    if (spotIds.length > 0) {
        eventAssignments = await db
            .select()
            .from(table.carpoolAssignments)
            .where(inArray(table.carpoolAssignments.carpoolSpotId, spotIds));
    }

    const mentors = await db.select({
        id: table.user.id,
        username: table.user.username
    }).from(table.user);

    return {
        event: { id: eventData.id, ...eventData.data },
        registrations,
        carpoolSpots,
        assignments: eventAssignments,
        mentors
    };
};

export const actions: Actions = {
    createSpot: async ({ request, params, locals }) => {
        const formData = await request.formData();
        const mentorId = formData.get("mentorId") as string;
        const capacityStr = formData.get("capacity") as string;
        const capacity = parseInt(capacityStr);
        const driverName = formData.get("driverName") as string;
        const eventId = params.id;

        if (!eventId) return fail(400, { message: "Event ID is required" });

        const db = locals.db;
        await db.insert(table.carpoolSpots).values({
            id: crypto.randomUUID(),
            eventId,
            mentorId,
            capacity: isNaN(capacity) ? 0 : capacity,
            driverName: driverName || "Unknown"
        });

        return { success: true };
    },
    deleteSpot: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get("id") as string;

        const db = locals.db;
        // Delete assignments first
        await db.delete(table.carpoolAssignments).where(eq(table.carpoolAssignments.carpoolSpotId, id));
        await db.delete(table.carpoolSpots).where(eq(table.carpoolSpots.id, id));

        return { success: true };
    },
    assignStudent: async ({ request, locals }) => {
        const formData = await request.formData();
        const carpoolSpotId = formData.get("carpoolSpotId") as string;
        const studentId = formData.get("studentId") as string;

        const db = locals.db;
        await db.insert(table.carpoolAssignments).values({
            id: crypto.randomUUID(),
            carpoolSpotId,
            studentId
        });

        return { success: true };
    },
    unassignStudent: async ({ request, locals }) => {
        const formData = await request.formData();
        const studentId = formData.get("studentId") as string;
        const carpoolSpotId = formData.get("carpoolSpotId") as string;

        const db = locals.db;
        await db
            .delete(table.carpoolAssignments)
            .where(
                and(
                    eq(table.carpoolAssignments.studentId, studentId),
                    eq(table.carpoolAssignments.carpoolSpotId, carpoolSpotId)
                )
            );

        return { success: true };
    }
};
