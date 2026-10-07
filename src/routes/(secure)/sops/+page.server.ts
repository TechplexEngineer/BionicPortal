import { fail, redirect } from "@sveltejs/kit";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

const sopForm = z.object({
	title: z.string().trim().min(1, "Title is required").max(200),
	content: z.string().trim().min(1, "Markdown content is required"),
	private: z.boolean()
});

function requireSopAccess(user: App.Locals["user"]) {
	if (!user || !["user", "mentor", "admin"].includes(user.role)) {
		throw redirect(302, "/dashboard");
	}
	return user;
}

function requireSopEditor(user: App.Locals["user"]) {
	if (!user || (user.role !== "admin" && user.role !== "mentor")) {
		throw redirect(302, "/dashboard");
	}
}

function parseSopForm(formData: FormData) {
	return sopForm.safeParse({
		...Object.fromEntries(formData),
		private: formData.get("shareWithStudents") !== "on"
	});
}

export const load = (async ({ locals, url }) => {
	const user = requireSopAccess(locals.user);
	const query = locals.db.select().from(table.sops);
	const sops = await (user.role === "user"
		? query
				.where(and(eq(table.sops.private, false), eq(table.sops.archived, false)))
				.orderBy(asc(table.sops.title))
		: url.searchParams.get("archived") === "1"
			? query.orderBy(asc(table.sops.title))
			: query.where(eq(table.sops.archived, false)).orderBy(asc(table.sops.title)));
	const selectedId = url.searchParams.get("id");
	const selectedSop = selectedId ? (sops.find((sop) => sop.id === selectedId) ?? null) : null;
	return { user, sops, selectedSop };
}) satisfies PageServerLoad;

export const actions: Actions = {
	create: async ({ locals, request }) => {
		requireSopEditor(locals.user);
		const parsed = parseSopForm(await request.formData());
		if (!parsed.success)
			return fail(400, { message: parsed.error.issues[0]?.message ?? "Invalid SOP" });

		const now = new Date();
		const id = crypto.randomUUID();
		await locals.db
			.insert(table.sops)
			.values({ id, ...parsed.data, createdAt: now, updatedAt: now });
		return { success: "SOP created.", id };
	},
	update: async ({ locals, request }) => {
		requireSopEditor(locals.user);
		const formData = await request.formData();
		const values = Object.fromEntries(formData);
		const id = typeof values.id === "string" ? values.id : "";
		const parsed = parseSopForm(formData);
		if (!id) return fail(400, { message: "Invalid SOP ID" });
		if (!parsed.success)
			return fail(400, { message: parsed.error.issues[0]?.message ?? "Invalid SOP" });

		const updated = await locals.db
			.update(table.sops)
			.set({ ...parsed.data, updatedAt: new Date() })
			.where(eq(table.sops.id, id))
			.returning({ id: table.sops.id });
		if (updated.length === 0) return fail(400, { message: "SOP not found" });
		return { success: "SOP saved.", id };
	},
	archive: async ({ locals, request }) => {
		const user = requireSopAccess(locals.user);
		if (user.role === "mentor") requireSopEditor(user);
		const id = (await request.formData()).get("id");
		if (typeof id !== "string" || !id) return fail(400, { message: "Invalid SOP ID" });

		const [sop] = await locals.db.select().from(table.sops).where(eq(table.sops.id, id)).limit(1);
		if (!sop || sop.archived || (user.role === "user" && sop.private)) {
			return fail(400, { message: "SOP cannot be archived" });
		}

		const updated = await locals.db
			.update(table.sops)
			.set({ archived: true, updatedAt: new Date() })
			.where(
				and(
					eq(table.sops.id, id),
					eq(table.sops.archived, false),
					user.role === "user" ? eq(table.sops.private, false) : undefined
				)
			)
			.returning({ id: table.sops.id });
		if (updated.length === 0) return fail(400, { message: "SOP cannot be archived" });
		return { success: "SOP archived.", id };
	},
	restore: async ({ locals, request }) => {
		requireSopEditor(locals.user);
		const id = (await request.formData()).get("id");
		if (typeof id !== "string" || !id) return fail(400, { message: "Invalid SOP ID" });

		const [sop] = await locals.db.select().from(table.sops).where(eq(table.sops.id, id)).limit(1);
		if (!sop || !sop.archived) return fail(400, { message: "SOP cannot be restored" });

		const updated = await locals.db
			.update(table.sops)
			.set({ archived: false, updatedAt: new Date() })
			.where(and(eq(table.sops.id, id), eq(table.sops.archived, true)))
			.returning({ id: table.sops.id });
		if (updated.length === 0) return fail(400, { message: "SOP cannot be restored" });
		return { success: "SOP restored.", id };
	},
	delete: async ({ locals, request }) => {
		if (locals.user?.role !== "admin") throw redirect(302, "/dashboard");
		const id = (await request.formData()).get("id");
		if (typeof id !== "string" || !id) return fail(400, { message: "Invalid SOP ID" });
		const deleted = await locals.db
			.delete(table.sops)
			.where(eq(table.sops.id, id))
			.returning({ id: table.sops.id });
		if (deleted.length === 0) return fail(400, { message: "SOP not found" });
		return { success: "SOP deleted." };
	}
};
