import { fail, redirect } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, "/login");
	}

	const db = event.locals.db;
	const userId = event.locals.user.id;

	// Check if the user already has a parent profile
	const [profile] = await db
		.select()
		.from(table.parentProfiles)
		.where(eq(table.parentProfiles.userId, userId));

	// Get linked students with names
	const links = await db
		.select()
		.from(table.parentStudentLinks)
		.where(eq(table.parentStudentLinks.parentId, userId));

	const linkedStudents = await Promise.all(
		links.map(async (link) => {
			const [student] = await db
				.select()
				.from(table.students)
				.where(eq(table.students.userid, link.studentId));
			return student ?? { userid: link.studentId, firstName: "", lastName: "" };
		})
	);

	return {
		user: event.locals.user,
		profile: profile ?? null,
		hasProfile: !!profile,
		linkedStudents
	};
};

export const actions: Actions = {
	default: async (event) => {
		if (!event.locals.user) {
			return fail(401, { message: "Unauthorized" });
		}

		const formData = await event.request.formData();
		const studentEmail = (formData.get("studentEmail") as string)?.toLowerCase().trim();
		const phone = (formData.get("phone") as string)?.trim();

		if (!studentEmail) {
			return fail(400, { message: "Student email is required" });
		}

		const db = event.locals.db;
		const userId = event.locals.user.id;

		// 1. Verify student exists
		const [student] = await db
			.select()
			.from(table.students)
			.where(eq(table.students.userid, studentEmail));

		if (!student) {
			return fail(400, {
				message:
					"No student found with that email address. Please make sure your student has registered first."
			});
		}

		try {
			// 2. Save or update parent profile (phone)
			if (phone) {
				await db.insert(table.parentProfiles).values({ userId, phone }).onConflictDoUpdate({
					target: table.parentProfiles.userId,
					set: { phone }
				});
			}

			// 3. Create link
			await db
				.insert(table.parentStudentLinks)
				.values({
					parentId: userId,
					studentId: studentEmail
				})
				.onConflictDoNothing();

			// 4. Update user role to 'parent' if it's currently 'user'
			if (event.locals.user.role === "user") {
				await db.update(table.user).set({ role: "parent" }).where(eq(table.user.id, userId));
			}

			return {
				success: true,
				message: `Successfully connected to ${student.firstName} ${student.lastName}!`
			};
		} catch (e) {
			console.error("Failed to connect parent to student:", e);
			return fail(500, { message: "An error occurred while connecting to the student." });
		}
	}
};
