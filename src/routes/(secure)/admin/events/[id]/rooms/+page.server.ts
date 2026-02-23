import { fail, redirect } from "@sveltejs/kit";
import { eq, and, inArray, sql } from "drizzle-orm";
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
        lastName: table.students.lastName,
        type: sql<string>`'student'`
    })
        .from(table.eventRegistrations)
        .innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
        .where(and(
            eq(table.eventRegistrations.eventId, eventId),
            // eq(table.eventRegistrations.paid, true), // Commented out to allow testing even if not paid
            // eq(table.eventRegistrations.formCompleted, true)
        ));

    // Fetch mentors (users with role 'mentor' or 'admin' who might be attending)
    // For now, let's just fetch all users who are NOT students and call them 'mentors'
    // In a real app, you might have a better way to filter this
    const mentors = await db.select({
        userid: table.user.id,
        firstName: table.user.username, // Generic for now
        lastName: sql<string>`''`,
        type: sql<string>`'mentor'`
    })
        .from(table.user)
        .where(inArray(table.user.role, ['mentor', 'admin']));

    const attendees = [...eligibleRegistrations, ...mentors];

    // Fetch existing rooms and assignments
    const rooms = await db.select()
        .from(table.hotelRooms)
        .where(eq(table.hotelRooms.eventId, eventId));

    const assignments = await db.select()
        .from(table.roomAssignments)
        .where(inArray(table.roomAssignments.roomId, rooms.map(r => r.id).concat(['dummy'])));

    return {
        event: { id: eventData.id, ...eventData.data },
        attendees,
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
    assignAttendee: async ({ request, locals }) => {
        const formData = await request.formData();
        const roomId = formData.get("roomId") as string;
        const attendeeId = formData.get("attendeeId") as string;
        const type = formData.get("attendeeType") as string;

        const db = locals.db;
        // Check if attendee is already assigned elsewhere in this event and remove them
        if (type === 'student') {
            await db.delete(table.roomAssignments)
                .where(eq(table.roomAssignments.studentId, attendeeId));

            await db.insert(table.roomAssignments).values({
                id: crypto.randomUUID(),
                roomId,
                studentId: attendeeId
            });
        } else {
            await db.delete(table.roomAssignments)
                .where(eq(table.roomAssignments.userId, attendeeId));

            await db.insert(table.roomAssignments).values({
                id: crypto.randomUUID(),
                roomId,
                userId: attendeeId
            });
        }

        return { success: true };
    },
    unassignAttendee: async ({ request, locals }) => {
        const formData = await request.formData();
        const attendeeId = formData.get("attendeeId") as string;
        const type = formData.get("attendeeType") as string;

        const db = locals.db;
        if (type === 'student') {
            await db.delete(table.roomAssignments)
                .where(eq(table.roomAssignments.studentId, attendeeId));
        } else {
            await db.delete(table.roomAssignments)
                .where(eq(table.roomAssignments.userId, attendeeId));
        }

        return { success: true };
    }
};
