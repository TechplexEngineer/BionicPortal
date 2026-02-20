import { fail, redirect } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    const db = event.locals.db;
    const eventId = event.params.id;

    const [eventData] = await db.select()
        .from(table.events)
        .where(eq(table.events.id, eventId));

    if (!eventData) {
        return redirect(302, "/admin/events");
    }

    const registrations = await db.select({
        id: table.eventRegistrations.id,
        paid: table.eventRegistrations.paid,
        formCompleted: table.eventRegistrations.formCompleted,
        invoiceId: table.eventRegistrations.invoiceId,
        student: {
            userid: table.students.userid,
            firstName: table.students.firstName,
            lastName: table.students.lastName,
            dietaryRestrictions: table.students.dietaryRestrictions
        }
    })
        .from(table.eventRegistrations)
        .innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
        .where(eq(table.eventRegistrations.eventId, eventId));

    return {
        event: { id: eventData.id, ...eventData.data },
        registrations
    };
};

export const actions: Actions = {
    togglePaid: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get("id") as string;
        const paid = formData.get("paid") === "true";

        const db = locals.db;
        await db.update(table.eventRegistrations)
            .set({ paid: !paid })
            .where(eq(table.eventRegistrations.id, id));

        return { success: true };
    },
    toggleForm: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get("id") as string;
        const formCompleted = formData.get("formCompleted") === "true";

        const db = locals.db;
        await db.update(table.eventRegistrations)
            .set({ formCompleted: !formCompleted })
            .where(eq(table.eventRegistrations.id, id));

        return { success: true };
    },
    createInvoice: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = formData.get("id") as string;
        const studentEmail = formData.get("studentEmail") as string;

        // Mock QuickBooks API call
        console.log(`Creating QuickBooks invoice for ${studentEmail}...`);
        const mockInvoiceId = `QB-${Math.floor(Math.random() * 1000000)}`;

        const db = locals.db;
        await db.update(table.eventRegistrations)
            .set({ invoiceId: mockInvoiceId })
            .where(eq(table.eventRegistrations.id, id));

        return { success: true, invoiceId: mockInvoiceId };
    }
};
