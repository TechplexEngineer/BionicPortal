import type { PageServerLoad } from './$types';

export const load = (async ({ locals, params }) => {
    return {
        currentUser: locals.db.query.user.findFirst({
            where: (user, { eq }) => eq(user.id, params.userid),
        }),
    };
}) satisfies PageServerLoad;