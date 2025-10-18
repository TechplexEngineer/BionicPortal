import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    // SELECT * FROM attendance JOIN users ON users.userid=attendance.userid

    const meetingsResult = await locals.db.run(sql`
        SELECT DATE(timestamp, 'unixepoch') as date, COUNT(*) as count
        FROM attendance
        GROUP BY DATE(timestamp, 'unixepoch')
    `);
    const meetings: { date: string; count: number }[] = meetingsResult.results as any ?? [];

    const students = await locals.db.query.students.findMany({
        with: {
            attendance: true
        }
    });

    type Row = {
        email: string;
        first: string;
        last: string;
        total: number;
        percent: number;
        // Meetings: Record<string, string>;
        [key: string]: string | number;
    };
    const totalMeetings = meetings.length;
    console.log('Total Meetings:', totalMeetings);


    const attend: Row[] = [];


    for (const student of students) {
        const row: Row = {
            email: student.userid,
            first: student.firstName,
            last: student.lastName,
            total: student.attendance?.length ?? 0,
            percent: `${totalMeetings > 0 ? ((student.attendance?.length ?? 0) / totalMeetings) * 100 : 0}%`,
            // Meetings: {},
        };

        for (const meeting of meetings) {
            const meetingDate = meeting.date; // 'YYYY-MM-DD'
            const attended = student.attendance?.some(att => {
                const attDate = att.timestamp.toISOString().slice(0, 10);
                return attDate === meetingDate;
            }) ?? false;

            row[meetingDate] = attended ? 'x' : '';
        }

        attend.push(row);
    }

    // type UserId = string;
    // const attend: Record<UserId, RowData> = {};

    // 

    // // Assuming attendance data is available via students.attendance
    // for (const student of students) {
    //     const userId = student.userid;
    //     const firstName = student.firstName;
    //     const lastName = student.lastName;
    //     const attendanceRecords = student.attendance ?? [];

    //     const rowData: RowData = {
    //         UserID: userId,
    //         FirstName: firstName,
    //         LastName: lastName,
    //         Total: attendanceRecords.length,
    //         Percent: totalMeetings > 0 ? (attendanceRecords.length / totalMeetings) * 100 : 0,
    //         Meetings: {}
    //     };

    //     for (const record of attendanceRecords) {
    //         const date = record.timestamp.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    //         rowData.Meetings[date] = "x";
    //     }

    //     attend[userId] = rowData;
    // }

    return { students, meetings, attend };
}) satisfies PageServerLoad;