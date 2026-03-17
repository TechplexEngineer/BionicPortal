import { fail, redirect } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { sendEmail } from "$lib/server/brevo";
import type { Actions, PageServerLoad } from "./$types";

const { env } = await import("$env/dynamic/private");

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
        invoiceId: table.eventRegistrations.invoiceId,
        invoicePaymentLink: table.eventRegistrations.invoicePaymentLink,
        student: {
            userid: table.students.userid,
            firstName: table.students.firstName,
            lastName: table.students.lastName,
            parentEmails: table.students.parentEmails
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
    send: async ({ request, locals, params }) => {
        const formData = await request.formData();
        const subject = formData.get("subject") as string;
        const template = formData.get("template") as string;
        const recipientIds = formData.getAll("recipients") as string[];
        const sendToStudents = formData.get("sendToStudents") === "on";
        const sendToParents = formData.get("sendToParents") === "on";

        const apiKey = env.BREVO_API_KEY;
        if (!apiKey) return fail(500, { message: "Brevo API key not configured" });

        const db = locals.db;
        const eventId = params.id;

        const [eventData] = await db.select().from(table.events).where(eq(table.events.id, eventId));
        if (!eventData) return fail(404, { message: "Event not found" });

        // Fetch detailed registration info for selected IDs
        const registrations = await db.select({
            id: table.eventRegistrations.id,
            invoicePaymentLink: table.eventRegistrations.invoicePaymentLink,
            student: table.students
        })
            .from(table.eventRegistrations)
            .innerJoin(table.students, eq(table.eventRegistrations.studentId, table.students.userid))
            .where(and(
                eq(table.eventRegistrations.eventId, eventId)
            ));

        const selectedRegs = registrations.filter(r => recipientIds.includes(r.id));

        let sentCount = 0;
        let errorCount = 0;

        for (const reg of selectedRegs) {
            const recipients: { email: string, name?: string }[] = [];
            if (sendToStudents) {
                recipients.push({ email: reg.student.userid, name: `${reg.student.firstName} ${reg.student.lastName}` });
            }
            if (sendToParents && reg.student.parentEmails) {
                const parents = reg.student.parentEmails.split(",").map(e => ({ email: e.trim() }));
                recipients.push(...parents);
            }

            if (recipients.length === 0) continue;

            // Replace placeholders
            let htmlContent = template
                .replace(/{{first_name}}/g, reg.student.firstName)
                .replace(/{{last_name}}/g, reg.student.lastName)
                .replace(/{{event_name}}/g, eventData.data.name)
                .replace(/{{payment_link}}/g, reg.invoicePaymentLink || "No payment link available")
                .replace(/{{cost}}/g, eventData.data.cost.toString());

            try {
                await sendEmail(recipients, subject, htmlContent, apiKey);
                sentCount++;
            } catch (err) {
                console.error(`Failed to send email to ${reg.student.userid}:`, err);
                errorCount++;
            }
        }

        return { success: true, sentCount, errorCount };
    }
};
