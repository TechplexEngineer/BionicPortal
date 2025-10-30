import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    const users = await locals.db.query.user.findMany();
    return { users };
}) satisfies PageServerLoad;