import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from './$types';
import * as XLSX from 'xlsx';
import { students } from '$lib/server/db/schema';

export const load = (async () => {
    return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
    importstudents: async ({ request, locals }) => {
        const formData = await request.formData();
        const file = formData.get("studentsList");
        if (!(file instanceof File)) {
            return fail(400, { error: "No file uploaded" });
        }

        const mapping = {
            email: formData.get("map_email") as string,
            firstName: formData.get("map_firstName") as string,
            lastName: formData.get("map_lastName") as string,
        };

        if (!mapping.email || !mapping.firstName || !mapping.lastName) {
            return fail(400, { error: "All mappings are required" });
        }

        const buffer = await file.arrayBuffer();
        if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
            return fail(400, { error: "Unsupported file type, only csv or xls supported" });
        }

        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as Record<string, any>[];

        let importedCount = 0;
        for (const row of rows) {
            const email = row[mapping.email]?.toString().trim();
            const first = row[mapping.firstName]?.toString().trim();
            const last = row[mapping.lastName]?.toString().trim();

            if (!email || !first || !last) continue;

            try {
                await locals.db.insert(students).values({
                    userid: email,
                    firstName: first,
                    lastName: last,
                    customFields: "{}"
                }).onConflictDoUpdate({
                    target: students.userid,
                    set: {
                        firstName: first,
                        lastName: last
                    }
                });
                importedCount++;
            } catch (err) {
                console.log("Error inserting row:", row, err);
                continue;
            }
        }

        return { success: true, imported: importedCount };
    }
};