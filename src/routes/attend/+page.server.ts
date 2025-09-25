import type { PageServerLoad } from './$types';

export const load = (async () => {
    return {
        events: [
            {
                name: 'NERD @ BMHS',
                dateStr: 'Oct 4, 2025 7:00:00 EST'
            },
            {
                name: 'Battle of the Bay @ PMHS',
                dateStr: 'Nov 1, 2025 7:00:00 EST'
            },
            {
                name: 'Kickoff @ BMHS',
                dateStr: 'Jan 10, 2026 12:00:00 EST'
            },
            {
                name: 'Week 0 (Preseason) @ TBD',
                dateStr: 'Feb 21, 2026 7:00:00 EST'
            },
            {
                name: 'Week 1 - Minuteman District Event @ BMHS',
                dateStr: 'Mar 6, 2026 17:00:00 EST'
            },
            {
                name: 'Week 2 - TBD @ TBD',
                dateStr: 'Mar 13, 2026 17:00:00 EST'
            },
            {
                name: 'Week 4 - TBD @ TBD',
                dateStr: 'Mar 27, 2026 17:00:00 EST'
            },
            {
                name: 'Week 5 - TBD @ TBD',
                dateStr: 'Apr 3, 2026 17:00:00 EST'
            },
            {
                name: 'Week 7 - District Championship @ Big-E',
                dateStr: 'April 15, 2026 17:00:00 EST'
            },
        ]
    };
}) satisfies PageServerLoad;

