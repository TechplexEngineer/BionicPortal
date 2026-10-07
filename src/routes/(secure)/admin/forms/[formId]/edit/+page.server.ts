import { error, fail, redirect } from "@sveltejs/kit";
import { validateDefinition } from "@team4909/bionic-sign";
import { and, eq, notExists } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
	if (locals.user?.role !== "admin") throw error(403, "Forbidden");
	const [form] = await locals.db
		.select()
		.from(table.standaloneForms)
		.where(eq(table.standaloneForms.id, params.formId));
	if (!form) throw redirect(302, "/admin/forms");
	const [assignment] = await locals.db
		.select({ id: table.standaloneFormAssignments.id })
		.from(table.standaloneFormAssignments)
		.where(eq(table.standaloneFormAssignments.formId, form.id))
		.limit(1);
	return { form, hasAssignments: Boolean(assignment) };
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		if (locals.user?.role !== "admin") return fail(403, { message: "Forbidden." });
		const formData = await request.formData();
		const name = formData.get("name")?.toString().trim();
		const definitionValue = formData.get("definition")?.toString();
		if (!name || !definitionValue)
			return fail(400, { message: "A form name and definition are required." });
		let definition;
		try {
			definition = validateDefinition(JSON.parse(definitionValue));
		} catch {
			return fail(400, { message: "The form definition is invalid." });
		}
		const [form] = await locals.db
			.select({ id: table.standaloneForms.id, definition: table.standaloneForms.definition })
			.from(table.standaloneForms)
			.where(eq(table.standaloneForms.id, params.formId));
		if (!form) return fail(404, { message: "Form not found." });
		const definitionChanged = JSON.stringify(form.definition) !== JSON.stringify(definition);
		if (definitionChanged) {
			const updated = await locals.db
				.update(table.standaloneForms)
				.set({ name, definition })
				.where(
					and(
						eq(table.standaloneForms.id, params.formId),
						notExists(
							locals.db
								.select({ id: table.standaloneFormAssignments.id })
								.from(table.standaloneFormAssignments)
								.where(eq(table.standaloneFormAssignments.formId, params.formId))
						)
					)
				)
				.returning({ id: table.standaloneForms.id });
			if (!updated.length)
				return fail(409, { message: "Fields cannot be changed after students have been assigned. You can still rename this form." });
		} else {
			await locals.db
				.update(table.standaloneForms)
				.set({ name })
				.where(eq(table.standaloneForms.id, params.formId));
		}
		throw redirect(303, "/admin/forms");
	}
};
