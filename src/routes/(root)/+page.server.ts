import type { PageServerLoad } from "./$types";

export const load = (async ({ locals }) => {
    const eventResult = await locals.db.query.events.findMany();
    const events = eventResult.map((e) => ({
        name: e.data.name,
        dateStr: e.data.startDate
    }));

    return {
        events
    };
}) satisfies PageServerLoad;
