import { fail, redirect } from "@sveltejs/kit";
import { eq, and, inArray } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    const db = event.locals.db;
    const eventId = event.params.id;

    const [eventData] = await db.select()
        .from(table.events)
        .where(eq(table.events.id, eventId));

    if (!eventData || !eventData.data.isOvernight) {
        return redirect(302, "/admin/events");
    }

    // Fetch students who have met requirements (Paid + Form)
    const eligibleRegistrations = await db.select({
        userid: table.students.userid,
        firstName: table.students.firstName,
        lastName: table.students.lastName
    })
        .from(table.eventRegistrations)
        .innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
        .where(and(
            eq(table.eventRegistrations.eventId, eventId),
            eq(table.eventRegistrations.paid, true),
            eq(table.eventRegistrations.formCompleted, true)
        ));

    // Fetch existing rooms and assignments
    const rooms = await db.select()
        .from(table.hotelRooms)
        .where(eq(table.hotelRooms.eventId, eventId));

    const assignments = await db.select()
        .from(table.roomAssignments)
        .where(inArray(table.roomAssignments.roomId, rooms.map(r => r.id).concat(['dummy'])));

    return {
        event: { id: eventData.id, ...eventData.data },
        students: eligibleRegistrations,
        rooms,
        assignments
    };
};

export const actions: Actions = {
    createRoom: async ({ request, locals, params }) => {
        const formData = await request.formData();
        const roomName = formData.get("roomName") as string;
        const gender = formData.get("gender") as string;

        const db = locals.db;
        await db.insert(table.hotelRooms).values({
            id: crypto.randomUUID(),
            eventId: params.id,
            roomName,
            gender
        });

        return { success: true };
    },
    assignStudent: async ({ request, locals }) => {
        const formData = await request.formData();
        const roomId = formData.get("roomId") as string;
        const studentId = formData.get("studentId") as string;

        const db = locals.db;
        // Check if student is already assigned elsewhere in this event and remove them
        // (Simplification: unassign from all rooms for now)
        await db.delete(table.roomAssignments)
            .where(eq(table.roomAssignments.studentId, studentId));

        await db.insert(table.roomAssignments).values({
            id: crypto.randomUUID(),
            roomId,
            studentId
        });

        return { success: true };
    },
    unassignStudent: async ({ request, locals }) => {
        const formData = await request.formData();
        const studentId = formData.get("studentId") as string;

        const db = locals.db;
        await db.delete(table.roomAssignments)
            .where(eq(table.roomAssignments.studentId, studentId));

        return { success: true };
    }
};
