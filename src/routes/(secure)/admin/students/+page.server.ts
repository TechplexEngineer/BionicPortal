import type { PageServerLoad } from "./$types";

export const load = (async ({ locals }) => {
	const students = await locals.db.query.students.findMany();
	return {
		students
	};
}) satisfies PageServerLoad;
