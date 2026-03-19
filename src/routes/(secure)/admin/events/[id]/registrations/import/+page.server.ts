import { fail, redirect } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
import * as XLSX from 'xlsx';

export const load: PageServerLoad = async (event) => {
    const db = event.locals.db;
    const eventId = event.params.id;

    const [eventData] = await db.select()
        .from(table.events)
        .where(eq(table.events.id, eventId));

    if (!eventData) {
        return redirect(302, "/admin/events");
    }

    return {
        event: { id: eventData.id, ...eventData.data }
    };
};

export const actions: Actions = {
    import: async ({ request, locals, params }) => {
        const formData = await request.formData();
        const file = formData.get("file");
        const eventId = params.id;

        if (!(file instanceof File)) {
            return fail(400, { error: "No file uploaded" });
        }

        const mapping = {
            email: formData.get("map_email") as string,
            firstName: formData.get("map_firstName") as string,
            lastName: formData.get("map_lastName") as string,
            paid: formData.get("map_paid") as string,
            formCompleted: formData.get("map_formCompleted") as string,
        };

        if (!mapping.email) {
            return fail(400, { error: "Email mapping is required" });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as Record<string, any>[];

        const db = locals.db;
        let importedCount = 0;

        for (const row of rows) {
            const email = row[mapping.email]?.toString().trim().toLowerCase();
            if (!email) continue;

            try {
                // 1. Find or create student
                let [student] = await db.select()
                    .from(table.students)
                    .where(eq(table.students.userid, email));

                if (!student && mapping.firstName && mapping.lastName) {
                    const firstName = row[mapping.firstName]?.toString().trim();
                    const lastName = row[mapping.lastName]?.toString().trim();
                    if (firstName && lastName) {
                        await db.insert(table.students).values({
                            userid: email,
                            firstName,
                            lastName,
                            customFields: "{}"
                        });
                        [student] = await db.select()
                            .from(table.students)
                            .where(eq(table.students.userid, email));
                    }
                }

                if (!student) {
                    console.log(`Skipping row, student not found and not enough info to create: ${email}`);
                    continue;
                }

                // 2. Parse statuses
                let paid = false;
                if (mapping.paid && row[mapping.paid] !== undefined) {
                    const val = row[mapping.paid].toString().toLowerCase();
                    paid = val === "true" || val === "1" || val === "yes" || val === "paid";
                }

                let formCompleted = false;
                if (mapping.formCompleted && row[mapping.formCompleted] !== undefined) {
                    const val = row[mapping.formCompleted].toString().toLowerCase();
                    formCompleted = val === "true" || val === "1" || val === "yes" || val === "completed";
                }

                // 3. Check for existing registration
                const [existing] = await db.select()
                    .from(table.eventRegistrations)
                    .where(and(
                        eq(table.eventRegistrations.eventId, eventId),
                        eq(table.eventRegistrations.studentId, email)
                    ));

                if (existing) {
                    // Update existing
                    await db.update(table.eventRegistrations)
                        .set({ paid, formCompleted })
                        .where(eq(table.eventRegistrations.id, existing.id));
                } else {
                    // Create new
                    await db.insert(table.eventRegistrations).values({
                        id: crypto.randomUUID(),
                        eventId,
                        studentId: email,
                        paid,
                        formCompleted
                    });
                }
                importedCount++;
            } catch (err) {
                console.error(`Error importing row for ${email}:`, err);
            }
        }

        return { success: true, imported: importedCount };
    }
};
