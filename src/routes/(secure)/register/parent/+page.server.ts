import { fail, redirect } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user) {
        return redirect(302, "/login");
    }

    // Check if the user is already linked to any students
    const links = await event.locals.db.select()
        .from(table.parentStudentLinks)
        .where(eq(table.parentStudentLinks.parentId, event.locals.user.id));

    return {
        user: event.locals.user,
        links
    };
};

export const actions: Actions = {
    default: async (event) => {
        if (!event.locals.user) {
            return fail(401, { message: "Unauthorized" });
        }

        const formData = await event.request.formData();
        const studentEmail = (formData.get("studentEmail") as string)?.toLowerCase().trim();

        if (!studentEmail) {
            return fail(400, { message: "Student email is required" });
        }

        const db = event.locals.db;

        // 1. Verify student exists
        const [student] = await db.select()
            .from(table.students)
            .where(eq(table.students.userid, studentEmail));

        if (!student) {
            return fail(400, { message: "No student found with that email address. Please make sure your student has registered first." });
        }

        try {
            // 2. Create link
            await db.insert(table.parentStudentLinks)
                .values({
                    parentId: event.locals.user.id,
                    studentId: studentEmail
                })
                .onConflictDoNothing();

            // 3. Update user role to 'parent' if it's currently 'user'
            if (event.locals.user.role === "user") {
                await db.update(table.user)
                    .set({ role: "parent" })
                    .where(eq(table.user.id, event.locals.user.id));
            }

            return { success: true, message: `Successfully connected to ${student.firstName} ${student.lastName}!` };
        } catch (e) {
            console.error("Failed to connect parent to student:", e);
            return fail(500, { message: "An error occurred while connecting to the student." });
        }
    }
};
