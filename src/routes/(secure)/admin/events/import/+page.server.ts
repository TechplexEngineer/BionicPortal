import { fail, redirect } from "@sveltejs/kit";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";
import * as XLSX from 'xlsx';

export const load: PageServerLoad = async () => {
    return {};
};

export const actions: Actions = {
    import: async ({ request, locals }) => {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return fail(400, { error: "No file uploaded" });
        }

        const fields = [
            "name", "startDate", "endDate", "location", "registrationDueDate", "cost",
            "isOvernight", "departureTime", "returnTime", "description", "hotelAddress"
        ];
        const mapping: Record<string, string> = {};
        fields.forEach(field => {
            mapping[field] = formData.get(`map_${field}`) as string;
        });

        if (!mapping.name || !mapping.startDate || !mapping.endDate || !mapping.location || !mapping.registrationDueDate || !mapping.cost) {
            return fail(400, { error: "Required mappings are missing" });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as Record<string, any>[];

        const db = locals.db;
        let importedCount = 0;

        for (const row of rows) {
            const name = row[mapping.name]?.toString().trim();
            if (!name) continue;

            try {
                const eventData: table.EventData = {
                    name,
                    startDate: parseDate(row[mapping.startDate]),
                    endDate: parseDate(row[mapping.endDate]),
                    location: row[mapping.location]?.toString().trim(),
                    registrationDueDate: parseDate(row[mapping.registrationDueDate]),
                    cost: parseFloat(row[mapping.cost]?.toString().replace(/[^0-9.]/g, '') || "0"),
                    isOvernight: parseBoolean(row[mapping.isOvernight]),
                    departureTime: mapping.departureTime ? parseDateTime(row[mapping.departureTime]) : "",
                    returnTime: mapping.returnTime ? parseDateTime(row[mapping.returnTime]) : "",
                    description: row[mapping.description]?.toString().trim() || "",
                    hotelAddress: row[mapping.hotelAddress]?.toString().trim() || "",
                    studentsPerRoom: 4,
                    mentorsPerRoom: 2
                };

                await db.insert(table.events).values({
                    id: crypto.randomUUID(),
                    data: eventData
                });

                importedCount++;
            } catch (err) {
                console.error(`Error importing event ${name}:`, err);
            }
        }

        return { success: true, imported: importedCount };
    }
};

function parseDate(val: any): string {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
}

function parseDateTime(val: any): string {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16); // format for datetime-local
}

function parseBoolean(val: any): boolean {
    if (val === undefined || val === null) return false;
    const s = val.toString().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "on";
}
