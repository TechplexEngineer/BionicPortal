import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user) {
        return redirect(302, "/login");
    }

    const db = event.locals.db;
    const [student] = await db.select()
        .from(table.students)
        .where(eq(table.students.userid, event.locals.user.username));

    return {
        student: student ? {
            ...student,
            customFields: student.customFields ? JSON.parse(student.customFields) : {}
        } : null,
        email: event.locals.user.username
    };
};

export const actions: Actions = {
    default: async (event) => {
        if (!event.locals.user) {
            return fail(401, { message: "Unauthorized" });
        }

        const formData = await event.request.formData();
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const dietaryRestrictions = formData.get("dietaryRestrictions") as string;
        const parentEmails = formData.get("parentEmails") as string;
        const phone = formData.get("phone") as string;
        const parentPhone = formData.get("parentPhone") as string;

        // Handle custom fields
        const customFields: Record<string, string> = {};
        for (const [key, value] of formData.entries()) {
            if (key.startsWith("custom_")) {
                customFields[key.replace("custom_", "")] = value as string;
            }
        }

        if (!firstName || !lastName) {
            return fail(400, { message: "First and last name are required" });
        }

        const db = event.locals.db;
        const email = event.locals.user.username;

        try {
            await db.insert(table.students)
                .values({
                    userid: email,
                    firstName,
                    lastName,
                    dietaryRestrictions,
                    parentEmails,
                    phone,
                    parentPhone,
                    customFields: JSON.stringify(customFields)
                })
                .onConflictDoUpdate({
                    target: table.students.userid,
                    set: {
                        firstName,
                        lastName,
                        dietaryRestrictions,
                        parentEmails,
                        phone,
                        parentPhone,
                        customFields: JSON.stringify(customFields)
                    }
                });

            return { success: true, message: "Profile updated successfully!" };
        } catch (e) {
            console.error("Failed to update profile:", e);
            return fail(500, { message: "An error occurred while saving your profile." });
        }
    }
};
