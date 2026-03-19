import { fail } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";
import { events } from "$lib/server/db/schema";
import { createSmugmugAlbum } from "$lib/server/smugmug";

export const load: PageServerLoad = async ({ locals }) => {
	const eventList = await locals.db.query.events.findMany({
		orderBy: (events, { asc }) => [asc(events.dateStr)]
	});
	return { events: eventList };
};

export const actions = {
	create: async ({ request, locals, platform }) => {
		const data = await request.formData();
		const name = data.get("name");
		const dateStr = data.get("dateStr");
		const location = data.get("location");

		if (typeof name !== "string" || !name.trim()) {
			return fail(400, { error: "Event name is required" });
		}
		if (typeof dateStr !== "string" || !dateStr.trim()) {
			return fail(400, { error: "Event date is required" });
		}

		const id = crypto.randomUUID();
		let smugmugAlbumUrl: string | null = null;
		let smugmugUploadUrl: string | null = null;

		if (platform) {
			const albumResult = await createSmugmugAlbum(name.trim(), platform);
			if (albumResult) {
				smugmugAlbumUrl = albumResult.albumUrl;
				smugmugUploadUrl = albumResult.uploadUrl;
			}
		}

		await locals.db.insert(events).values({
			id,
			name: name.trim(),
			dateStr: dateStr.trim(),
			location: typeof location === "string" && location.trim() ? location.trim() : null,
			smugmugAlbumUrl,
			smugmugUploadUrl
		});

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get("id");

		if (typeof id !== "string") {
			return fail(400, { error: "Invalid event ID" });
		}

		await locals.db.delete(events).where(eq(events.id, id));

		return { success: true };
	}
} satisfies Actions;
