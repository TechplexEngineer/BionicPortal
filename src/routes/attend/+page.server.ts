import type { Actions, PageServerLoad } from './$types';

const members = [
    { name: "John Doe", id: 1, here: false },
    { name: "Jane Smith", id: 2, here: false },
    { name: "Alice Johnson", id: 3, here: false },
    { name: "Bob Brown", id: 4, here: false },
    { name: "Charlie Davis", id: 5, here: false },
    { name: "Eve Wilson", id: 6, here: true },
    { name: "Frank Miller", id: 7, here: true },
    { name: "Grace Lee", id: 8, here: true },
];

export const load = (async () => {
    return {
        events: [
            {
                name: 'NERD @ BMHS',
                dateStr: 'Oct 4, 2025 7:00:00 EST'
            },
            // {
            //     name: 'Battle of the Bay @ PMHS',
            //     dateStr: 'Nov 1, 2025 7:00:00 EST'
            // },
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
        ],
        membersNotHere: members.filter(m => !m.here),
        membersHere: members.filter(m => m.here)
    };
}) satisfies PageServerLoad;

export const actions = {
    checkin: async ({ request }) => {
        const data = await request.formData();
        const studentID = data.get('userid');
        console.log(`Checkin for ${studentID}`);

        const member = members.find(m => m.id === Number(studentID));
        if (member) {
            member.here = true;
        }

        return { success: true };
    }
} satisfies Actions;