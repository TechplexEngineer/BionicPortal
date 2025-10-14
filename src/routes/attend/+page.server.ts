import type { Actions, PageServerLoad } from "./$types";
import { students, attendance } from "$lib/server/db/schema";

export const load = (async ({ locals }) => {

    // get a list of students that have checked in within the last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const membersResult = await locals.db.query.students.findMany({
        with: {
            attendance: {
                where: (attendance, { gte }) =>
                    gte(attendance.timestamp, sixHoursAgo)
            }
        }
    });

    const members = membersResult.map(m => ({
        id: m.userid,
        name: `${m.firstName} ${m.lastName}`,
        here: m.attendance.length > 0
    }))

    return {
        events: [
            {
                name: "NERD @ BMHS",
                dateStr: "Oct 4, 2025 7:00:00 EST"
            },
            // {
            //     name: 'Battle of the Bay @ PMHS',
            //     dateStr: 'Nov 1, 2025 7:00:00 EST'
            // },
            {
                name: "Kickoff @ BMHS",
                dateStr: "Jan 10, 2026 12:00:00 EST"
            },
            {
                name: "Week 0 (Preseason) @ TBD",
                dateStr: "Feb 21, 2026 7:00:00 EST"
            },
            {
                name: "Week 1 - Minuteman District Event @ BMHS",
                dateStr: "Mar 6, 2026 17:00:00 EST"
            },
            {
                name: "Week 2 - TBD @ TBD",
                dateStr: "Mar 13, 2026 17:00:00 EST"
            },
            {
                name: "Week 4 - TBD @ TBD",
                dateStr: "Mar 27, 2026 17:00:00 EST"
            },
            {
                name: "Week 5 - TBD @ TBD",
                dateStr: "Apr 3, 2026 17:00:00 EST"
            },
            {
                name: "Week 7 - District Championship @ Big-E",
                dateStr: "April 15, 2026 17:00:00 EST"
            }
        ],
        membersNotHere: members.filter((m) => !m.here).sort((a, b) => a.name.localeCompare(b.name)),
        membersHere: members.filter((m) => m.here).sort((a, b) => a.name.localeCompare(b.name))
    };
}) satisfies PageServerLoad;

export const actions = {
    checkin: async ({ request, locals }) => {
        const data = await request.formData();
        const studentID = data.get("userid");
        console.log(`Checkin for ${studentID}`);

        if (typeof studentID !== "string") {
            return { success: false, error: "Invalid student ID" };
        }

        // check if the student exists
        const student = await locals.db.query.students.findFirst({
            where: (students, { eq }) => eq(students.userid, studentID)
        });

        if (!student) {
            return { success: false, error: "Student not found" };
        }

        // check if the student is already checked in
        const attendanceRecords = await locals.db.query.attendance.findFirst({
            where: (attendance, { eq }) =>
                eq(attendance.userid, studentID)
        });

        if (attendanceRecords) {
            return { success: false, error: "Student already checked in" };
        }

        // insert a new attendance record
        await locals.db.insert(attendance).values({
            userid: studentID,
            date: "JUNK",
            timestamp: new Date()
        });

        return { success: true };
    }
} satisfies Actions;
