import type { PageServerLoad } from './$types';

export const load = (async ({ locals, params }) => {
    const student = await locals.db.query.students.findFirst({
        where: (students, { eq }) => eq(students.userid, params.userid)
    });
    return { student };
}) satisfies PageServerLoad;