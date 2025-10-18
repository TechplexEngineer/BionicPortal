import { fail } from 'assert';
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

        const buffer = await file.arrayBuffer();
        let rows: Record<string, any>[] = [];

        if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
            return fail(400, { error: "Unsupported file type, only csv or xls supported" });
        }

        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const expectedHeaders = ["email", "first", "last"];
        const actualHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];
        const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));
        if (missingHeaders.length > 0) {
            return fail(400, { error: `Missing required headers: ${missingHeaders.join(", ")}` });
        }

        for (const row of rows) {
            try {
                await locals.db.insert(students).values({
                    userid: row['email'],
                    firstName: row['first'],
                    lastName: row['last'],
                    data: "{}"
                });
            } catch (err) {
                // Optionally handle duplicate or invalid rows
                console.log("Error inserting row:", row, err);
                continue;
            }
        }

        //throw redirect(303, "/dashboard");
        return { success: true, imported: rows.length };
    }
};