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

    return { students, meetings, attend };
}) satisfies PageServerLoad;