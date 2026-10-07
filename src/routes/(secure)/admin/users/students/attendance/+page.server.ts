import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import * as table from "$lib/server/db/schema";
import { ATTENDANCE_SEASON_START, ATTENDANCE_SEASON_START_TIMESTAMP } from "$lib/server/attendance";
import type { PageServerLoad } from "./$types";

export const load = (async ({ locals, url }) => {
	// SELECT * FROM attendance JOIN users ON users.userid=attendance.userid
	const showArchived = url.searchParams.get("showArchived") === "true";
	const lastYear = String(new Date().getFullYear() - 1);

	const meetingsResult = await locals.db.run(sql`
        SELECT DATE(timestamp, 'unixepoch') as date, COUNT(*) as count
        FROM attendance
        WHERE DATE(timestamp, 'unixepoch') >= ${ATTENDANCE_SEASON_START}
        GROUP BY DATE(timestamp, 'unixepoch')
    `);
	const meetings: { date: string; count: number }[] =
		(meetingsResult.results as unknown as { date: string; count: number }[]) ?? [];

	const students = await locals.db.query.students.findMany({
		where: showArchived
			? undefined
			: and(
					eq(table.students.hidden, false),
					or(
						isNull(table.students.graduationYear),
						eq(table.students.graduationYear, ""),
						ne(table.students.graduationYear, lastYear)
					)
				),
		with: {
			attendance: {
				where: (attendance, { gte }) => gte(attendance.timestamp, ATTENDANCE_SEASON_START_TIMESTAMP)
			}
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
	console.log("Total Meetings:", totalMeetings);

	const attend: Row[] = [];

	for (const student of students) {
		const row: Row = {
			email: student.userid,
			first: student.firstName,
			last: student.lastName,
			total: student.attendance?.length ?? 0,
			percent: totalMeetings > 0 ? ((student.attendance?.length ?? 0) / totalMeetings) * 100 : 0
			// Meetings: {},
		};

		for (const meeting of meetings) {
			const meetingDate = meeting.date; // 'YYYY-MM-DD'
			const attended =
				student.attendance?.some((att) => {
					const attDate = att.timestamp.toISOString().slice(0, 10);
					return attDate === meetingDate;
				}) ?? false;

			row[meetingDate] = attended ? "x" : "";
		}

		attend.push(row);
	}

	return { students, meetings, attend, showArchived };
}) satisfies PageServerLoad;
