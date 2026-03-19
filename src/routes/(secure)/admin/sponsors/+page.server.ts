import type { PageServerLoad } from "./$types";

export const load = (async ({ locals }) => {
	const sponsors = await locals.db.query.sponsors.findMany();
	return { sponsors };
}) satisfies PageServerLoad;
