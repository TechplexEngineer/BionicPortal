import { error, fail } from "@sveltejs/kit";
import { and, eq, notExists } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== "admin") throw error(403, "Forbidden");
	const [forms, assignments] = await Promise.all([
		locals.db.select().from(table.standaloneForms),
		locals.db
			.select({ formId: table.standaloneFormAssignments.formId })
			.from(table.standaloneFormAssignments)
	]);
	return {
		forms: forms.map((form) => ({
			...form,
			studentCount: assignments.filter((assignment) => assignment.formId === form.id).length
		}))
	};
};

export const actions: Actions = {
	toggleStatus: async ({ request, locals }) => {
		if (locals.user?.role !== "admin") return fail(403, { message: "Forbidden." });
		const formData = await request.formData();
		const formId = formData.get("formId")?.toString();
		const nextStatus = formData.get("status")?.toString();
		if (!formId || (nextStatus !== "draft" && nextStatus !== "assigned")) {
			return fail(400, { message: "Invalid form status." });
		}
		const [form] = await locals.db
			.select({ id: table.standaloneForms.id, status: table.standaloneForms.status })
			.from(table.standaloneForms)
			.where(eq(table.standaloneForms.id, formId));
		if (!form) return fail(404, { message: "Form not found." });
		if (nextStatus === "assigned" && form.status !== "assigned") {
			const students = await locals.db
				.select({ userid: table.students.userid })
				.from(table.students)
				.where(eq(table.students.hidden, false));
			await Promise.all(
				students.map((student) =>
					locals.db
						.insert(table.standaloneFormAssignments)
						.values({ id: crypto.randomUUID(), formId, studentId: student.userid })
						.onConflictDoNothing()
				)
			);
		}
		await locals.db
			.update(table.standaloneForms)
			.set({ status: nextStatus })
			.where(eq(table.standaloneForms.id, formId));
		return {
			success: true,
			message:
				nextStatus === "assigned" ? "Form assigned to all students." : "Form returned to draft."
		};
	},
	delete: async ({ request, locals, platform }) => {
		if (locals.user?.role !== "admin") return fail(403, { message: "Forbidden." });
		const formId = (await request.formData()).get("formId");
		if (typeof formId !== "string" || !formId) return fail(400, { message: "Invalid form ID." });
		const [form] = await locals.db
			.select({ basePdfKey: table.standaloneForms.basePdfKey })
			.from(table.standaloneForms)
			.where(eq(table.standaloneForms.id, formId));
		if (!form) return fail(404, { message: "Form not found." });
		const bucket = platform?.env.FORMS_BUCKET;
		if (!bucket) return fail(503, { message: "Form storage is unavailable." });
		const deleted = await locals.db
			.delete(table.standaloneForms)
			.where(
				and(
					eq(table.standaloneForms.id, formId),
					notExists(
						locals.db
							.select({ id: table.standaloneFormAssignments.id })
							.from(table.standaloneFormAssignments)
							.where(eq(table.standaloneFormAssignments.formId, formId))
					)
				)
			)
			.returning({ id: table.standaloneForms.id });
		if (!deleted.length)
			return fail(409, { message: "Remove unsubmitted assignments before deleting this form." });
		try {
			await bucket.delete(form.basePdfKey);
		} catch (error) {
			console.error("Failed to remove standalone form PDF:", form.basePdfKey, error);
			return {
				success: true,
				warning: true,
				message: "Form deleted, but its blank PDF could not be removed from storage."
			};
		}
		return { success: true, message: "Form deleted." };
	}
};
