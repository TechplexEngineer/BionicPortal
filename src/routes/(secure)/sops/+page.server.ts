import { fail, redirect } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import * as table from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

const sopForm = z.object({
	title: z.string().trim().min(1, "Title is required").max(200),
	content: z.string().trim().min(1, "Markdown content is required")
});

function requireSopAccess(user: App.Locals["user"]) {
	if (!user || (user.role !== "admin" && user.role !== "mentor")) {
		throw redirect(302, "/dashboard");
	}
	return user;
}

function requireAdmin(user: App.Locals["user"]) {
	if (user?.role !== "admin") throw redirect(302, "/dashboard");
}

export const load = (async ({ locals, url }) => {
	const user = requireSopAccess(locals.user);
	const sops = await locals.db.select().from(table.sops).orderBy(asc(table.sops.title));
	const selectedId = url.searchParams.get("id");
	const selectedSop = selectedId ? (sops.find((sop) => sop.id === selectedId) ?? null) : null;
	return { user, sops, selectedSop };
}) satisfies PageServerLoad;

export const actions: Actions = {
	create: async ({ locals, request }) => {
		requireAdmin(locals.user);
		const parsed = sopForm.safeParse(Object.fromEntries(await request.formData()));
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
		requireAdmin(locals.user);
		const values = Object.fromEntries(await request.formData());
		const id = typeof values.id === "string" ? values.id : "";
		const parsed = sopForm.safeParse(values);
		if (!id) return fail(400, { message: "Invalid SOP ID" });
		if (!parsed.success)
			return fail(400, { message: parsed.error.issues[0]?.message ?? "Invalid SOP" });

		await locals.db
			.update(table.sops)
			.set({ ...parsed.data, updatedAt: new Date() })
			.where(eq(table.sops.id, id));
		return { success: "SOP saved.", id };
	},
	delete: async ({ locals, request }) => {
		requireAdmin(locals.user);
		const id = (await request.formData()).get("id");
		if (typeof id !== "string" || !id) return fail(400, { message: "Invalid SOP ID" });
		await locals.db.delete(table.sops).where(eq(table.sops.id, id));
		return { success: "SOP deleted." };
	}
};
